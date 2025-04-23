import { lazy } from '@seahax/lazy';

import { background } from '../background.ts';
import { createJwksRepositoryFactory } from './repository/jwks.ts';
import { createPasswordsRepository } from './repository/passwords.ts';
import { createSessionRepository } from './repository/sessions.ts';
import { createUsersRepository, type User } from './repository/users.ts';
import { getPasswordHash, HASH_PARAMS } from './util/get-password-hash.ts';
import { isPasswordMatch } from './util/is-password-match.ts';
import { isRehashRequired } from './util/is-rehash-required.ts';

export interface LoginResult {
  user: User;
  accessToken: string;
  refreshToken: string;
}

interface AuthService {
  login(params: { email: string; password: string }): Promise<LoginResult | null>;
  refresh(params: { token: string | undefined }): Promise<LoginResult | null>;
  updatePassword(params: { email: string; password: string; newPassword: string }): Promise<boolean>;
}

export function createAuthServiceFactory(): () => AuthService {
  const createJwksRepository = createJwksRepositoryFactory();

  return () => {
    const users = lazy(createUsersRepository);
    const passwords = lazy(createPasswordsRepository);
    const jwks = lazy(createJwksRepository);
    const refreshTokens = lazy(() => createSessionRepository());

    return {
      async login({ email, password }) {
        const user = await users().get({ email });

        if (!user) return null;

        const isAuthenticated = await authenticate({ userId: user.id, password });

        if (!isAuthenticated) return null;
        if (isAuthenticated === 'rehash') rehash({ userId: user.id, password });

        const accessToken = createJwtToken();
        const refreshToken = await refreshTokens().create({ userId: user.id });

        return { user, accessToken, refreshToken: refreshToken.refreshToken };
      },

      async refresh({ token }) {
        if (!token) return null;

        const refreshToken = await refreshTokens().get({ refreshToken: token });

        if (!refreshToken) return null;

        const user = await users().get({ id: refreshToken.userId });

        if (!user) return null;

        const accessToken = createJwtToken();

        return { user, accessToken, refreshToken: refreshToken.refreshToken };
      },

      async updatePassword({ email, password, newPassword }) {
        const user = await users().get({ email });

        if (!user) return false;

        const isAuthenticated = await authenticate({ userId: user.id, password });

        if (!isAuthenticated) return false;

        await setPassword({ userId: user.id, password: newPassword });

        return true;
      },
    };

    async function authenticate({ userId, password }: {
      userId: string;
      password: string;
    }): Promise<boolean | 'rehash'> {
      const passwordData = await passwords().get({ userId });

      if (!passwordData) return false;

      const { hash, params } = passwordData;
      const isMatch = await isPasswordMatch({ password, hash });

      if (!isMatch) return false;

      return isRehashRequired(params, HASH_PARAMS) ? 'rehash' : true;
    }

    function rehash(params: {
      userId: string;
      password: string;
    }): void {
      background(async () => await setPassword(params), 'rehash-password');
    }

    async function setPassword({ userId, password }: {
      userId: string;
      password: string;
    }): Promise<void> {
      const hash = await getPasswordHash({ password });

      await passwords().put({
        userId: userId,
        hash,
        params: HASH_PARAMS,
      });
    }

    function createJwtToken(): string {
      // TODO: Create JWT token.
      void jwks;
      return '';
    }
  };
}
