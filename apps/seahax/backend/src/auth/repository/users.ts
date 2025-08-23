import { zodCodec } from '@seahax/zod-codec';
import { BSON } from 'mongodb';
import Cache from 'quick-lru';
import { z } from 'zod';

import { config } from '../../services/config.ts';

interface UserRepository {
  findUser(query: Pick<User, 'id'> | Pick<User, 'email'>): Promise<User | null>;
  upsertUser(user: User): Promise<boolean>;
}

type UserDoc = z.input<typeof $USER_DOC>;
export type User = z.input<typeof $USER>;

export function getUserRepository(): UserRepository {
  const emailToId = new Cache<string, string>(CACHE_CONFIG);
  const idToUser = new Cache<string, User>(CACHE_CONFIG);
  const collection = config.mongo.db('auth').collection<UserDoc>('users');

  return {
    async findUser(query) {
      const id = 'id' in query ? query.id : emailToId.get(query.email);
      let user = (id && idToUser.get(id)) || null;

      if (!user) {
        const filter = 'id' in query ? { _id: BSON.UUID.createFromHexString(query.id) } : { email: query.email };
        const doc = await collection.findOne(filter);
        user = doc && $USER_DOC.parse(doc);
      }

      if (user) {
        emailToId.set(user.email, user.id);
        idToUser.set(user.id, user);
      }

      return user;
    },

    async upsertUser(user) {
      const { _id, ...doc } = $USER.parse(user);
      const result = await collection.updateOne({ _id }, { $set: doc }, { upsert: true });

      if (result.matchedCount <= 0) return false;

      emailToId.set(doc.email, user.id);
      idToUser.set(user.id, user);

      return true;
    },
  };
}

const CACHE_CONFIG = { maxSize: 1000 } as const;

const [$USER, $USER_DOC] = zodCodec(
  {
    input: z.object({
      id: z.string().uuid(),
      email: z.string().email(),
    }),
    transform: (user) => ({
      _id: BSON.UUID.createFromHexString(user.id),
      email: user.email,
    }),
  },
  {
    input: z.object({
      _id: z.instanceof(BSON.UUID),
      email: z.string().email(),
    }),
    transform: (doc) => ({
      id: doc._id.toHexString(true),
      email: doc.email,
    }),
  },
);
