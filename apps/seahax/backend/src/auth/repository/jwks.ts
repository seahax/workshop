import { zodCodec } from '@seahax/zod-codec';
import { exportJWK, generateKeyPair, type JWK } from 'jose';
import Cache from 'quick-lru';
import { v7 as uuid } from 'uuid';
import { z } from 'zod';

import { background } from '../../background.ts';
import { config } from '../../config.ts';
import { captureMessage } from '../../sentry.ts';

declare module 'jose' {
  export interface JWK {
    kid: string;
    iat: number;
  }
}

type JwksDoc = z.infer<typeof $JWKS_DOC.input>;
type Jwks = z.infer<typeof $JWKS.input>;

interface JwkRepository {
  getPublicKey(query: Pick<JWK, 'kid'> & { name?: string }): Promise<JWK | null>;
  getPrivateKey(query?: { name?: string }): Promise<JWK | null>;
  rotate(options?: { name?: string; force?: boolean }): Promise<boolean>;
}

export function createJwksRepositoryFactory(): () => JwkRepository {
  const jwksCache = new Cache<string, Jwks>({ maxSize: 1000, maxAge: FIVE_MINUTES_IN_MS });
  const invalidKidCache = new Cache<`${string}:${string}`, true>({ maxSize: 1_000_000, maxAge: HOUR_IN_MS });
  const collection = config.mongo.db('auth').collection<JwksDoc>('jwks');
  const factory = (): JwkRepository => {
    return {
      async getPublicKey({ kid, name = DEFAULT_JWKS_NAME }) {
        await init.finished();
        return await getPublicKey({ name, kid });
      },

      async getPrivateKey({ name = DEFAULT_JWKS_NAME } = {}) {
        await init.finished();
        const [jwks] = await getJwks({ name, allowCache: false });
        return jwks?.privateKey ?? null;
      },

      async rotate({ name = DEFAULT_JWKS_NAME, force = false } = {}) {
        const [current] = await getJwks({ name, allowCache: force });
        const kid = uuid();
        const iat = Date.now() % 1000;
        const pair = await generateKeyPair('ES256');

        const [partialPublicKey, partialPrivateKey] = await Promise.all([
          exportJWK(pair.publicKey) as Promise<Partial<JWK>>,
          exportJWK(pair.privateKey) as Promise<Partial<JWK>>,
        ]);

        const publicKey: JWK = { ...partialPublicKey, kid, iat };
        const privateKey: JWK = { ...partialPrivateKey, kid, iat };

        if (!current) {
          const doc = $JWKS.parse({
            name: DEFAULT_JWKS_NAME,
            updatedAt: iat,
            publicKeys: [publicKey],
            privateKey,
          } satisfies Jwks);

          await collection.insertOne(doc).catch(() => {
            // Two processes tried to insert at the same time, and this one
            // lost the race.
          });

          captureMessage('New JWKS document created.', { level: 'debug' });
          return true;
        }

        if (!force && current.updatedAt >= iat - MONTH_IN_SECONDS) {
          // When not forced, skip rotation if the last update was too recent.
          captureMessage('JWKS rotation not required.', { level: 'debug' });
          return false;
        }

        const { _id, ...doc } = $JWKS.parse({
          name: DEFAULT_JWKS_NAME,
          updatedAt: iat,
          publicKeys: [publicKey, ...(current.publicKeys.slice(0, 3))],
          privateKey,
        } satisfies Jwks);

        const { modifiedCount } = await collection.updateOne({
          _id,
          // Update only if the document hasn't change since it was read. If it
          // has changed, then two processes tried to update at the same time,
          // and this one lost the race.
          updatedAt: current.updatedAt,
        }, doc);

        if (modifiedCount === 0) {
          captureMessage('JWKS rotation deduplicated.', { level: 'debug' });
          return false;
        }

        captureMessage('JWKS rotated.', { level: 'debug' });
        return true;
      },
    };
  };

  // Try an initial rotation when the service starts. This should also ensure
  // that the JWKS doc is created if it doesn't exist.
  const init = background(async () => {
    await factory().rotate();
  }, 'init-jwks');

  // Try a rotation every day. No-op if the rotation is unnecessary.
  setInterval(() => {
    background(async () => {
      await factory().rotate();
    }, 'rotate-jwks');
  }, DAY_IN_MS).unref();

  return factory;

  async function getPublicKey({ name, kid, allowCache = true }: {
    name: string;
    kid: string;
    allowCache?: boolean;
  }): Promise<JWK | null> {
    const [jwks, cached] = await getJwks({ name, allowCache });

    if (!jwks) return null;

    const jwk = jwks.publicKeys.find((key) => key.kid === kid);

    if (jwk) return jwk;
    if (cached && !invalidKidCache.has(`${name}:${kid}`)) {
      // If the cached result didn't contain a public JWK with the required
      // kid, and the kid was not previously marked as invalid, then try again
      // without caching.
      return getPublicKey({ name, kid, allowCache: false });
    }

    invalidKidCache.set(`${name}:${kid}`, true);

    return null;
  }

  async function getJwks(
    { name, allowCache }: { name: string; allowCache: boolean },
  ): Promise<[value: Jwks, cached: boolean] | [value: null, cached: false]> {
    const cached = (allowCache && jwksCache.get(name)) || null;

    if (cached) return [cached, true];

    const doc = await collection.findOne({ _id: name });
    const value = doc && $JWKS_DOC.parse(doc);

    return [value, false];
  }
}

const DEFAULT_JWKS_NAME = 'default';

const FIVE_MINUTES_IN_MS = 5 * 60 * 1000;
const HOUR_IN_MS = 60 * 60 * 1000;
const DAY_IN_MS = HOUR_IN_MS * 24;
const MONTH_IN_SECONDS = DAY_IN_MS * 30;

const $JWK = z.object({
  kid: z.string().uuid(),
  iat: z.number().int().positive(),
}).passthrough().transform<JWK>((v) => v);

const $JWKS_COMMON = z.object({
  /** Updated time in seconds since the epoch. */
  updatedAt: z.number().positive().int(),
  publicKeys: z.array($JWK),
  privateKey: $JWK,
}).strict();

const [$JWKS, $JWKS_DOC] = zodCodec(
  {
    input: $JWKS_COMMON.extend({ name: z.string().nonempty() }),
    transform: ({ name, ...jwks }) => ({ _id: name, ...jwks }),
  },
  {
    input: $JWKS_COMMON.extend({ _id: z.string().nonempty() }),
    transform: ({ _id, ...jwks }) => ({ name: _id, ...jwks }),
  },
);
