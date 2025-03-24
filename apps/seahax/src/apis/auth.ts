import { z } from 'zod';

import { initApi, model } from './api.ts';

export const authSuccessModel = model<{
  accessToken: string;
  refreshToken: string;
}>();

export const authErrorModel = model<{
  error: string;
}>();

export const authApi = initApi({
  login: {
    summary: 'Login with email and password.',
    method: 'POST',
    path: '/auth/login',
    body: z.object({
      email: z.string(),
      password: z.string(),
    }),
    responses: {
      200: authSuccessModel,
      401: authErrorModel,
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
      200: authSuccessModel,
      401: authErrorModel,
    },
  },
}, {
  strictStatusCodes: true,
});
