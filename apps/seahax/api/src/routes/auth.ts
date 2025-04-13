import TsRest from '@seahax/ts-rest';

import { AuthLoginRequestSchema } from '../schemas/auth-login-request.ts';
import { AuthRefreshRequestSchema } from '../schemas/auth-refresh-request.ts';
import { AuthResponseErrorSchema } from '../schemas/auth-response-error.ts';
import { AuthResponseJwksSchema } from '../schemas/auth-response-jwks.ts';
import { AuthResponseTokensSchema } from '../schemas/auth-response-tokens.ts';
import { AuthSetPasswordRequestSchema } from '../schemas/auth-set-password-request.ts';

export const authRoutes = TsRest.routes({
  login: {
    summary: 'Login with email and password.',
    method: 'POST',
    path: '/auth/login',
    body: AuthLoginRequestSchema,
    responses: {
      200: AuthResponseTokensSchema,
      401: AuthResponseErrorSchema,
    },
  },

  setPassword: {
    summary: 'Set the password for an email address after verifying the current password.',
    method: 'POST',
    path: '/auth/set-password',
    body: AuthSetPasswordRequestSchema,
    responses: {
      200: TsRest.noBody(),
      401: AuthResponseErrorSchema,
    },
  },

  refresh: {
    summary: 'Refresh an access token.',
    method: 'POST',
    path: '/auth/refresh',
    body: AuthRefreshRequestSchema,
    responses: {
      200: AuthResponseTokensSchema,
      401: AuthResponseErrorSchema,
    },
  },

  jwks: {
    summary: 'Get well-known public JWKS json.',
    method: 'GET',
    path: '/auth/.well-known/jwks.json',
    responses: {
      200: AuthResponseJwksSchema,
    },
  },
}, {
  strictStatusCodes: true,
});
