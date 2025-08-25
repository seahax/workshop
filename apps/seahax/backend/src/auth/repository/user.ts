import { service } from '@seahax/service';
import { zodCodec } from '@seahax/zod-codec';
import { BSON } from 'mongodb';
import Cache from 'quick-lru';
import { z } from 'zod';

import { config } from '../../services/config.ts';

interface UserRepository {
  findUser(query: Pick<User, 'id'> | Pick<User, 'email'>): Promise<User | null>;
  upsertUser(user: User): Promise<boolean>;
}

export type User = z.input<typeof $USER>;

export const userRepository = service().build<UserRepository>(() => {
  const collection = config.mongo.db('auth').collection<z.input<typeof $USER_DOC>>('users');
  const emailToIdCache = new Cache<string, string>({ maxSize: 1000 });
  const idToUserCache = new Cache<string, User>({ maxSize: 1000 });

  return {
    async findUser(query) {
      const id = 'id' in query ? query.id : emailToIdCache.get(query.email);
      let user = (id && idToUserCache.get(id)) || null;

      if (!user) {
        const filter = 'id' in query ? { _id: BSON.UUID.createFromHexString(query.id) } : { email: query.email };
        const doc = await collection.findOne(filter);
        user = doc && $USER_DOC.parse(doc);
      }

      if (user) {
        emailToIdCache.set(user.email, user.id);
        idToUserCache.set(user.id, user);
      }

      return user;
    },

    async upsertUser(user) {
      const { _id, ...doc } = $USER.parse(user);
      await collection.insertOne({ _id, ...doc });
      const result = await collection.updateOne({ _id }, { $set: doc }, { upsert: true });

      if (result.matchedCount <= 0) return false;

      emailToIdCache.set(doc.email, user.id);
      idToUserCache.set(user.id, user);

      return true;
    },
  };
});

const [$USER, $USER_DOC] = zodCodec(
  {
    input: z.object({
      id: z.uuid(),
      email: z.email(),
    }),
    transform: (user) => ({
      _id: BSON.UUID.createFromHexString(user.id),
      email: user.email,
    }),
  },
  {
    input: z.object({
      _id: z.instanceof(BSON.UUID),
      email: z.email(),
    }),
    transform: (doc) => ({
      id: doc._id.toHexString(true),
      email: doc.email,
    }),
  },
);
