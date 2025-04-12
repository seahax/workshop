import { addTsRestExpressRoutes } from '@seahax/ts-rest-express';
import { authRoutes } from 'app-seahax-api';
import express from 'express';

import { createAuthService } from './service.ts';

export default function createAuthRouter(): express.Router {
  const service = createAuthService();
  const router = express.Router();

  return addTsRestExpressRoutes(router, authRoutes, {
    login: async ({ body }) => {
      const result = await service.login(body.email, body.password);

      return result
        ? { status: 200, body: result }
        : { status: 401, body: { error: 'Invalid credentials' } };
    },

    refresh: async ({ body }) => {
      const result = await service.refresh(body.refreshToken);

      return result
        ? { status: 200, body: result }
        : { status: 401, body: { error: 'Invalid refresh token' } };
    },

    jwks: async () => {
      return { status: 200, body: { keys: await service.jwks() } };
    },
  });
};
