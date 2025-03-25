import { initRouterSchema } from '@seahax/ts-rest';

import { AuthLoginRequest } from '../validators/auth-login-request.ts';
import { AuthRefreshRequest } from '../validators/auth-refresh-request.ts';
import { AuthResponseSuccess } from '../validators/auth-response-error.ts';
import { AuthResponseError } from '../validators/auth-response-success.ts';

export const authRouterSpec = initRouterSchema({
  login: {
    summary: 'Login with email and password.',
    method: 'POST',
    path: '/auth/login',
    body: AuthLoginRequest,
    responses: {
      200: AuthResponseSuccess,
    },
  },

  refresh: {
    summary: 'Refresh an access token.',
    method: 'POST',
    path: '/auth/refresh',
    body: AuthRefreshRequest,
    responses: {
      200: AuthResponseSuccess,
    },
  },
}, {
  commonResponses: {
    401: AuthResponseError,
  },
  strictStatusCodes: true,
});
