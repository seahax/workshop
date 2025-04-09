import { contract } from '@seahax/ts-rest';

import { AuthLoginRequestSchema } from '../schemas/auth-login-request.ts';
import { AuthRefreshRequestSchema } from '../schemas/auth-refresh-request.ts';
import { AuthResponseErrorSchema } from '../schemas/auth-response-error.ts';
import { AuthResponseJwksSchema } from '../schemas/auth-response-jwks.ts';
import { AuthResponseTokensSchema } from '../schemas/auth-response-tokens.ts';

export const authApiContract = contract.router({
  login: {
    summary: 'Login with email and password.',
    method: 'POST',
    path: '/login',
    body: AuthLoginRequestSchema,
    responses: {
      200: AuthResponseTokensSchema,
      401: AuthResponseErrorSchema,
    },
  },

  refresh: {
    summary: 'Refresh an access token.',
    method: 'POST',
    path: '/refresh',
    body: AuthRefreshRequestSchema,
    responses: {
      200: AuthResponseTokensSchema,
      401: AuthResponseErrorSchema,
    },
  },

  jwks: {
    summary: 'Get well-known public JWKS json.',
    method: 'GET',
    path: '/.well-known/jwks.json',
    responses: {
      200: AuthResponseJwksSchema,
    },
  },
}, {
  strictStatusCodes: true,
});
