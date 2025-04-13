import { addTsRestExpressRoutes } from '@seahax/ts-rest-express';
import { authRoutes } from 'app-seahax-api';
import express from 'express';

import { createAuthService } from './service.ts';

export default function createAuthRouter(): express.Router {
  const service = createAuthService();
  const router = express.Router();

  return addTsRestExpressRoutes(router, authRoutes, {
    login: async ({ body }) => {
      const tokens = await service.login(body.email, body.password);

      return tokens
        ? { status: 200, body: tokens }
        : INVALID_CREDENTIALS;
    },

    setPassword: async ({ body }) => {
      const { email, password, newPassword } = body;
      const success = await service.setPassword(email, password, newPassword);

      return success
        ? { status: 200 }
        : INVALID_CREDENTIALS;
    },

    refresh: async ({ body }) => {
      const result = await service.refresh(body.refreshToken);

      return result
        ? { status: 200, body: result }
        : INVALID_CREDENTIALS;
    },

    jwks: async () => {
      return { status: 200, body: { keys: await service.jwks() } };
    },
  });
};

const INVALID_CREDENTIALS = { status: 401, body: { error: 'Invalid credentials' } } as const;
