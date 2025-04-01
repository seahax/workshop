import { randomUUID } from 'node:crypto';

import { createPasswordRepository } from './repository/password.ts';
import { getPasswordHash, HASH_PARAMS } from './util/get-password-hash.ts';
import { isPasswordMatch } from './util/is-password-match.ts';
import { isRehashRequired } from './util/is-rehash-required.ts';

export interface AuthResponseTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponseJwks {
  keys: {
    alg: 'ES256';
    kty: 'EC';
    use: 'sig';
    key_ops: ['verify'];
    crv: 'P-256';
    kid: string;
    x: string;
    y: string;
  }[];
}

export interface AuthService {
  login(email: string, password: string): Promise<AuthResponseTokens | null>;
  refresh(refreshToken: string): Promise<AuthResponseTokens | null>;
  jwks(): Promise<AuthResponseJwks>;
}

export function createAuthService(): AuthService {
  const passwordRepo = createPasswordRepository();

  return {
    async login(email, password) {
      // TODO: Get user ID by email.
      const userId = randomUUID();
      const result = await passwordRepo.findOne(userId);

      if (!result) return null;

      const { id: passwordId, hash, params } = result;
      const match = await isPasswordMatch({ password, hash });

      if (!match) return null;

      if (isRehashRequired(params, HASH_PARAMS)) {
        const hash = await getPasswordHash({ password });

        await passwordRepo.upsert({
          id: passwordId,
          hash,
          params: HASH_PARAMS,
        });
      }

      // TODO: Generate tokens.
      return null;
    },

    async refresh() {
      return null;
    },

    async jwks() {
      return { keys: [] };
    },
  };
}
