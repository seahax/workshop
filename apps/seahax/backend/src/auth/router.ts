import { initExpressRouter } from '@seahax/ts-rest/express';
import { authRouterSpec } from 'app-seahax-api';
import type { Router } from 'express';

import { createAuthService } from './service.ts';

export default function createAuthRouter(): Router {
  const service = createAuthService();

  return initExpressRouter(authRouterSpec, {
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
