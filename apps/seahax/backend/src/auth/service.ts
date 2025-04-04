import { randomUUID } from 'node:crypto';

import { background } from '../background.ts';
import { createPasswordRepository } from './repository/password.ts';
import { getPasswordHash, HASH_PARAMS } from './util/get-password-hash.ts';
import { isPasswordMatch } from './util/is-password-match.ts';
import { isRehashRequired } from './util/is-rehash-required.ts';

interface Tokens {
  accessToken: string;
  refreshToken: string;
}

interface Jwk {
  alg: 'ES256';
  kty: 'EC';
  use: 'sig';
  key_ops: ['verify'];
  crv: 'P-256';
  kid: string;
  x: string;
  y: string;
}

interface AuthService {
  login(email: string, password: string): Promise<Tokens | null>;
  refresh(refreshToken: string): Promise<Tokens | null>;
  jwks(): Promise<Jwk[]>;
}

export function createAuthService(): AuthService {
  const passwordRepo = createPasswordRepository();
  const service: AuthService = {
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
      return [];
    },
  };

  background(async () => {
    // TODO: Create JWK key if missing.
  }, { task: 'setup-jwk', failureSeverity: 'warning' });

  background(async () => {
    // TODO: Add the admin user if missing and the APP_ADMIN_USER environment
    // variable is set.
  }, { task: 'setup-admin-user', failureSeverity: 'warning' });

  return service;
}
