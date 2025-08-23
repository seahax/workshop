import { zodCodec } from '@seahax/zod-codec';
import { BSON } from 'mongodb';
import { v7 as uuid } from 'uuid';
import { z } from 'zod';

import { config } from '../../services/config.ts';

type SessionDoc = z.infer<typeof $SESSION_DOC.input>;
type Session = z.infer<typeof $SESSION.input>;

interface SessionRepository {
  findSession(params: Pick<Session, 'refreshToken'>): Promise<Session | null>;
  insertSession(params: Pick<Session, 'userId'>): Promise<Session>;
}

export function getSessionRepository(): SessionRepository {
  const collection = config.mongo.db('auth').collection<SessionDoc>('sessions');

  return {
    async findSession({ refreshToken }) {
      const filter = { _id: BSON.UUID.createFromHexString(refreshToken) };
      const doc = await collection.findOne(filter);
      const value = doc && $SESSION_DOC.parse(doc);

      if (!value) return null;

      const now = Math.floor(Date.now() / 1000);

      return value.expiresAt <= now ? null : value;
    },

    async insertSession({ userId }) {
      const refreshToken = uuid();
      const expiresAt = Math.floor(Date.now() / 1000) + SEVEN_DAYS_IN_SECONDS;
      const session: Session = { refreshToken, expiresAt, userId };
      const doc = $SESSION.parse(session);

      await collection.insertOne(doc);

      return session;
    },
  };
}

const SEVEN_DAYS_IN_SECONDS = 7 * 24 * 60 * 60;

const [$SESSION, $SESSION_DOC] = zodCodec(
  {
    input: z.object({
      refreshToken: z.uuid(),
      /** Expiration time in seconds since the epoch. */
      expiresAt: z.number().positive().int(),
      userId: z.uuid(),
    }),
    transform: ({ refreshToken, userId, expiresAt }) => ({
      _id: BSON.UUID.createFromHexString(refreshToken),
      expiresAt: new Date(expiresAt * 1000),
      userId,
    }),
  },
  {
    input: z.object({
      _id: z.instanceof(BSON.UUID),
      expiresAt: z.instanceof(Date),
      userId: z.uuid(),
    }),
    transform: ({ _id, userId, expiresAt }) => ({
      refreshToken: _id.toHexString(),
      expiresAt: Math.floor(expiresAt.valueOf() / 1000),
      userId,
    }),
  },
);
