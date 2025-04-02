import zodCodec from '@seahax/zod-codec';
import { BSON } from 'mongodb';
import { z } from 'zod';

import { config } from '../../config.ts';

type Password = z.infer<typeof $password>;

interface PasswordRepository {
  findOne(id: string): Promise<Password | null>;
  upsert(password: Password): Promise<void>;
}

export function createPasswordRepository(): PasswordRepository {
  const collection = config.mongo.db('auth').collection<z.infer<typeof $passwordDoc>>('passwords');

  return {
    async findOne(id) {
      const doc = await collection.findOne({ _id: BSON.UUID.createFromHexString(id) });
      const value = doc && $password.parse(doc);

      return value;
    },

    async upsert(value: Password) {
      const { _id, ...doc } = $passwordDoc.parse(value);

      await collection.updateOne({ _id }, { $set: doc }, { upsert: true });
    },
  };
}

const { decoded: $password, encoded: $passwordDoc } = zodCodec({
  encoded: z.object({
    _id: z.instanceof(BSON.UUID),
    hash: z.string(),
    params: z.object({
      algorithm: z.literal('argon2id'),
      iterations: z.instanceof(BSON.Int32),
      parallelism: z.instanceof(BSON.Int32),
      /** Memory size in KiB. */
      memorySize: z.instanceof(BSON.Int32),
      /** Hash length in bytes. */
      hashLength: z.instanceof(BSON.Int32),
    }),
  }),
  decoded: z.object({
    id: z.string().uuid(),
    hash: z.string(),
    params: z.object({
      algorithm: z.literal('argon2id'),
      iterations: z.number().int().min(1),
      parallelism: z.number().int().min(1),
      /** Memory size in KiB. */
      memorySize: z.number().int().min(1),
      /** Hash length in bytes. */
      hashLength: z.number().int().min(1),
    }),
  }),
  encode: ({ id, hash, params }) => ({
    _id: BSON.UUID.createFromHexString(id),
    hash,
    params: {
      algorithm: params.algorithm,
      iterations: new BSON.Int32(params.iterations),
      parallelism: new BSON.Int32(params.parallelism),
      memorySize: new BSON.Int32(params.memorySize),
      hashLength: new BSON.Int32(params.hashLength),
    },
  }),
  decode: ({ _id, hash, params }) => ({
    id: _id.toHexString(true),
    hash,
    params: {
      algorithm: params.algorithm,
      iterations: params.iterations.valueOf(),
      parallelism: params.parallelism.valueOf(),
      memorySize: params.memorySize.valueOf(),
      hashLength: params.hashLength.valueOf(),
    },
  }),
});
