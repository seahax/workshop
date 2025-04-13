import { addTsRestExpressRoutes } from '@seahax/ts-rest-express';
import { authRoutes } from 'app-seahax-api';
import cookieParser from 'cookie-parser';
import express from 'express';

import { createAuthService } from './service.ts';

export default function createAuthRouter(): express.Router {
  const service = createAuthService();
  const router = express.Router();

  return addTsRestExpressRoutes(router, authRoutes, {
    getToken: {
      middleware: [cookieParser()],
      handler: async ({ body, cookies }) => {
        const tokens = body.type === 'refresh'
          ? await service.refresh(cookies.refreshToken)
          : await service.login(body.email, body.password);

        if (!tokens) return INVALID_CREDENTIALS;

        const { refreshToken, ...bodyTokens } = tokens;

        return {
          status: 200,
          headers: { 'Cache-Control': 'no-store' },
          cookies: { refreshToken: { value: refreshToken, httpOnly: true, secure: true, sameSite: 'strict' } },
          body: bodyTokens,
        };
      },
    },

    setPassword: async ({ body }) => {
      const { email, password, newPassword } = body;
      const success = await service.setPassword(email, password, newPassword);

      return success
        ? { status: 200 }
        : INVALID_CREDENTIALS;
    },
  });
};

const INVALID_CREDENTIALS = { status: 401, body: { error: 'Invalid credentials' } } as const;
