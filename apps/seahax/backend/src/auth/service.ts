import { background } from '../background.ts';
import { createJwkRepository, type Jwk } from './repository/jwk.ts';
import { createPasswordRepository } from './repository/password.ts';
import { createTokenRepository } from './repository/token.ts';
import { createUserRepository } from './repository/user.ts';
import { getPasswordHash, HASH_PARAMS } from './util/get-password-hash.ts';
import { isPasswordMatch } from './util/is-password-match.ts';
import { isRehashRequired } from './util/is-rehash-required.ts';

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

interface AuthService {
  login(email: string, password: string): Promise<Tokens | null>;
  setPassword(email: string, password: string, newPassword: string): Promise<boolean>;
  refresh(refreshToken: string): Promise<Tokens | null>;
  jwks(): Promise<Jwk[]>;
}

export function createAuthService(): AuthService {
  const userRepo = createUserRepository();
  const passwordRepo = createPasswordRepository();
  const jwkRepo = createJwkRepository();
  const tokenRepo = createTokenRepository();

  void jwkRepo;
  void tokenRepo;

  const service: AuthService = {
    async login(email, password) {
      const user = await userRepo.getUser({ email });

      if (!user) return null;

      const isAuthenticated = await authenticate(user.id, password);

      if (!isAuthenticated) return null;

      // TODO: Generate tokens.
      return null;
    },

    async setPassword(email, password, newPassword) {
      const user = await userRepo.getUser({ email });

      if (!user) return false;

      const isAuthenticated = await authenticate(user.id, password, false);

      if (!isAuthenticated) return false;

      await setPassword(user.id, newPassword);

      return true;
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
  }, 'setup-jwk');

  background(async () => {
    // TODO: Add the admin user if missing and the APP_ADMIN_USER environment
    // variable is set.
  }, 'setup-admin-user');

  return service;

  async function authenticate(userId: string, password: string, allowRehash = false): Promise<boolean> {
    const passwordData = await passwordRepo.findOne(userId);

    if (!passwordData) return false;

    const { hash, params } = passwordData;
    const isMatch = await isPasswordMatch({ password, hash });

    if (!isMatch) return false;

    if (allowRehash && isRehashRequired(params, HASH_PARAMS)) {
      background(async () => await setPassword(userId, password), 'rehash-password');
    }

    return true;
  }

  async function setPassword(userId: string, password: string): Promise<void> {
    const hash = await getPasswordHash({ password });

    await passwordRepo.upsert({
      id: userId,
      hash,
      params: HASH_PARAMS,
    });
  }
}
