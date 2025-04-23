import { addTsRestExpressRoutes } from '@seahax/ts-rest-express';
import { authRoutes } from 'app-seahax-api';
import cookieParser from 'cookie-parser';
import express from 'express';

import { createAuthServiceFactory } from './service.ts';

export default function createAuthRouter(): express.Router {
  const router = express.Router();
  const createAuthService = createAuthServiceFactory();

  return addTsRestExpressRoutes(router, authRoutes, {
    getToken: {
      middleware: [cookieParser()],
      handler: async ({ body, cookies }) => {
        const auth = createAuthService();
        const result = body.type === 'refresh'
          ? await auth.refresh({ token: cookies.refreshToken })
          : await auth.login({ email: body.email, password: body.password });

        if (!result) return INVALID_CREDENTIALS;

        const { user, accessToken, refreshToken } = result;

        return {
          status: 200,
          headers: { 'Cache-Control': 'no-store' },
          cookies: {
            refreshToken: {
              value: refreshToken,
              httpOnly: true,
              secure: true,
              sameSite: 'strict',
              path: authRoutes.getToken.path,
            },
          },
          body: { user, accessToken },
        };
      },
    },

    updatePassword: async ({ body }) => {
      const auth = createAuthService();
      const { email, password, newPassword } = body;
      const success = await auth.updatePassword({ email, password, newPassword });

      return success
        ? { status: 200 }
        : INVALID_CREDENTIALS;
    },
  });
};

const INVALID_CREDENTIALS = { status: 401, body: { error: 'Invalid credentials' } } as const;
