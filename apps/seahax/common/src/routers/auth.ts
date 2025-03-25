import { initRouterSpec, schema } from '@seahax/ts-rest';
import { z } from 'zod';

export const $AuthSuccess = schema<{
  accessToken: string;
  refreshToken: string;
}>();

export const $AuthError = schema<{
  error: string;
}>();

export const authRouterSpec = initRouterSpec({
  login: {
    summary: 'Login with email and password.',
    method: 'POST',
    path: '/auth/login',
    body: z.object({
      email: z.string(),
      password: z.string(),
    }),
    responses: {
      200: $AuthSuccess,
    },
  },

  refresh: {
    summary: 'Refresh an access token.',
    method: 'POST',
    path: '/auth/refresh',
    body: z.object({
      refreshToken: z.string(),
    }),
    responses: {
      200: $AuthSuccess,
    },
  },
}, {
  commonResponses: {
    401: $AuthError,
  },
  strictStatusCodes: true,
});
