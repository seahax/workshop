import { lazy } from '@seahax/lazy';

import { background } from '../background.ts';
import { getJwkRepositoryFactory } from './repository/jwks.ts';
import { getPasswordRepository } from './repository/passwords.ts';
import { getSessionRepository } from './repository/sessions.ts';
import { getUserRepository, type User } from './repository/users.ts';
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

export function getAuthServiceFactory(): () => AuthService {
  const getJwkRepository = getJwkRepositoryFactory();

  return () => {
    const users = lazy(getUserRepository);
    const passwords = lazy(getPasswordRepository);
    const jwks = lazy(getJwkRepository);
    const sessions = lazy(() => getSessionRepository());

    return {
      async login({ email, password }) {
        const user = await users().findUser({ email });

        if (!user) return null;

        const isAuthenticated = await verifyPassword({ userId: user.id, password });

        if (!isAuthenticated) return null;
        if (isAuthenticated === 'rehash') rehashPassword({ userId: user.id, password });

        const accessToken = createJwtToken();
        const refreshToken = await sessions().insertSession({ userId: user.id });

        return { user, accessToken, refreshToken: refreshToken.refreshToken };
      },

      async refresh({ token }) {
        if (!token) return null;

        const session = await sessions().findSession({ refreshToken: token });

        if (!session) return null;

        const user = await users().findUser({ id: session.userId });

        if (!user) return null;

        const accessToken = createJwtToken();

        return { user, accessToken, refreshToken: session.refreshToken };
      },

      async updatePassword({ email, password, newPassword }) {
        const user = await users().findUser({ email });

        if (!user) return false;

        const isAuthenticated = await verifyPassword({ userId: user.id, password });

        if (!isAuthenticated) return false;

        await setPassword({ userId: user.id, password: newPassword });

        return true;
      },
    };

    async function verifyPassword({ userId, password }: {
      userId: string;
      password: string;
    }): Promise<boolean | 'rehash'> {
      const passwordData = await passwords().findPassword({ userId });

      if (!passwordData) return false;

      const { hash, params } = passwordData;
      const isMatch = await isPasswordMatch({ password, hash });

      if (!isMatch) return false;

      return isRehashRequired(params, HASH_PARAMS) ? 'rehash' : true;
    }

    function rehashPassword(params: {
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

      await passwords().upsertPassword({
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
