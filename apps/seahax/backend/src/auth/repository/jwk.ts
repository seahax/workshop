import { interval } from '@seahax/interval';
import { service } from '@seahax/service';
import { zodCodec } from '@seahax/zod-codec';
import { captureMessage } from '@sentry/node';
import { exportJWK, generateKeyPair, type JWK } from 'jose';
import Cache from 'quick-lru';
import { v7 as uuid } from 'uuid';
import { z } from 'zod';

import { config } from '../../services/config.ts';

declare module 'jose' {
  export interface JWK {
    kid: string;
    iat: number;
  }
}

type JwksDoc = z.infer<typeof $JWKS_DOC.input>;
type Jwks = z.infer<typeof $JWKS.input>;

interface JwkRepository {
  findPublicKey(query: Pick<JWK, 'kid'> & { name?: string }): Promise<JWK | null>;
  findPrivateKey(query?: { name?: string }): Promise<JWK | null>;
  rotateKeys(options?: { name?: string; force?: boolean }): Promise<boolean>;
}

const DEFAULT_JWKS_NAME = 'default';

export const jwkRepository = service().build((): JwkRepository => {
  const collection = config.mongo.db('auth').collection<JwksDoc>('jwks');
  const jwkCache = new Cache<string, Jwks>({
    maxSize: 1000,
    maxAge: interval('5 minutes').as('milliseconds'),
  });
  const invalidKidCache = new Cache<`${string}:${string}`, true>({
    maxSize: 1_000_000,
    maxAge: interval('1 hour').as('milliseconds'),
  });

  return {
    async findPublicKey({ kid, name = DEFAULT_JWKS_NAME }) {
      return await findPublicKey({ name, kid });
    },

    async findPrivateKey({ name = DEFAULT_JWKS_NAME } = {}) {
      const [jwks] = await findJwks({ name, allowCache: false });
      return jwks?.privateKey ?? null;
    },

    async rotateKeys({ name = DEFAULT_JWKS_NAME, force = false } = {}) {
      const [current] = await findJwks({ name, allowCache: force });
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
          // Two processes tried to insert at the same time, and this one lost
          // the race.
        });

        captureMessage('New JWKS document created.', { level: 'debug' });
        return true;
      }

      if (!force && current.updatedAt >= iat - interval('28 days').as('seconds')) {
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

  async function findPublicKey({ name, kid, allowCache = true }: {
    name: string;
    kid: string;
    allowCache?: boolean;
  }): Promise<JWK | null> {
    const [jwks, cached] = await findJwks({ name, allowCache });

    if (!jwks) return null;

    const jwk = jwks.publicKeys.find((key) => key.kid === kid);

    if (jwk) return jwk;
    if (cached && !invalidKidCache.has(`${name}:${kid}`)) {
    // If the cached result didn't contain a public JWK with the required
    // kid, and the kid was not previously marked as invalid, then try again
    // without caching.
      return findPublicKey({ name, kid, allowCache: false });
    }

    invalidKidCache.set(`${name}:${kid}`, true);

    return null;
  }

  async function findJwks(
    { name, allowCache }: { name: string; allowCache: boolean },
  ): Promise<[value: Jwks, cached: boolean] | [value: null, cached: false]> {
    const cached = (allowCache && jwkCache.get(name)) || null;

    if (cached) return [cached, true];

    const doc = await collection.findOne({ _id: name });
    const value = doc && $JWKS_DOC.parse(doc);

    return [value, false];
  }
});

const $JWK = z.object({
  kid: z.uuid(),
  iat: z.number().int().positive(),
}).loose().transform<JWK>((v) => v);

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
