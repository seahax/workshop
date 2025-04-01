import { initRouterSchema } from '@seahax/ts-rest';

import { AuthLoginRequest } from '../validators/auth-login-request.ts';
import { AuthRefreshRequest } from '../validators/auth-refresh-request.ts';
import { AuthResponseError } from '../validators/auth-response-error.ts';
import { AuthResponseJwks } from '../validators/auth-response-jwks.ts';
import { AuthResponseTokens } from '../validators/auth-response-tokens.ts';

export const authRouterSpec = initRouterSchema({
  login: {
    summary: 'Login with email and password.',
    method: 'POST',
    path: '/login',
    body: AuthLoginRequest,
    responses: {
      200: AuthResponseTokens,
      401: AuthResponseError,
    },
  },

  refresh: {
    summary: 'Refresh an access token.',
    method: 'POST',
    path: '/refresh',
    body: AuthRefreshRequest,
    responses: {
      200: AuthResponseTokens,
      401: AuthResponseError,
    },
  },

  jwks: {
    summary: 'Get well-known public JWKS json.',
    method: 'GET',
    path: '/.well-known/jwks.json',
    responses: {
      200: AuthResponseJwks,
    },
  },
}, {
  strictStatusCodes: true,
});
