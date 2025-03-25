import { initExpressRouter } from '@seahax/ts-rest/express';

import { authRouterSpec } from '../../common/routers/auth.ts';

export const authRouter = initExpressRouter(authRouterSpec, {
  login: async ({ body }) => {
    void body;
    return { status: 200, body: { accessToken: '', refreshToken: '' } };
  },
  refresh: async ({ body }) => {
    void body;
    return { status: 200, body: { accessToken: '', refreshToken: '' } };
  },
});
