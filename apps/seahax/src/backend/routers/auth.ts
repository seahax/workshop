import { authApi } from '../../apis/auth.ts';
import { initExpressRouter } from './router.ts';

export const authRouter = initExpressRouter(authApi, {
  login: async ({ body }) => {
    void body;
    return { status: 200, body: { accessToken: '', refreshToken: '' } };
  },
  refresh: async ({ body }) => {
    void body;
    return { status: 200, body: { accessToken: '', refreshToken: '' } };
  },
});
