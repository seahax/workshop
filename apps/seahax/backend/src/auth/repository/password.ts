import { service } from '@seahax/service';
import { zodCodec } from '@seahax/zod-codec';
import { BSON } from 'mongodb';
import { z } from 'zod';

import { config } from '../../services/config.ts';

type PasswordDoc = z.infer<typeof $PASSWORD_DOC.input>;
type Password = z.infer<typeof $PASSWORD.input>;

export interface PasswordRepository {
  findPassword(query: Pick<Password, 'userId'>): Promise<Password | null>;
  upsertPassword(password: Password): Promise<boolean>;
}

export const passwordRepository = service().build((): PasswordRepository => {
  const collection = config.mongo.db('auth').collection<PasswordDoc>('passwords');

  return {
    async findPassword({ userId }) {
      const filter = { _id: BSON.UUID.createFromHexString(userId) };
      const doc = await collection.findOne(filter);
      const value = doc && $PASSWORD_DOC.parse(doc);

      return value;
    },

    async upsertPassword(value: Password) {
      const { _id, ...doc } = $PASSWORD.parse(value);
      const result = await collection.updateOne({ _id }, { $set: doc }, { upsert: true });

      return result.upsertedCount > 0;
    },
  };
});

const [$PASSWORD, $PASSWORD_DOC] = zodCodec(
  {
    input: z.object({
      userId: z.uuid(),
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
    transform: ({ userId, hash, params }) => ({
      _id: BSON.UUID.createFromHexString(userId),
      hash,
      params: {
        algorithm: params.algorithm,
        iterations: new BSON.Int32(params.iterations),
        parallelism: new BSON.Int32(params.parallelism),
        memorySize: new BSON.Int32(params.memorySize),
        hashLength: new BSON.Int32(params.hashLength),
      },
    }),
  },
  {
    input: z.object({
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
    transform: ({ _id, hash, params }) => ({
      userId: _id.toHexString(true),
      hash,
      params: {
        algorithm: params.algorithm,
        iterations: params.iterations.valueOf(),
        parallelism: params.parallelism.valueOf(),
        memorySize: params.memorySize.valueOf(),
        hashLength: params.hashLength.valueOf(),
      },
    }),
  },
);
