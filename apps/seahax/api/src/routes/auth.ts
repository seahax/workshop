import TsRest from '@seahax/ts-rest';

import { AuthErrorResponseSchema } from '../schemas/auth-error-response.ts';
import { AuthPostPasswordRequestSchema } from '../schemas/auth-post-password-request.ts';
import { AuthPostTokenRequestSchema } from '../schemas/auth-post-token-request.ts';
import { AuthPostTokenResponseSchema } from '../schemas/auth-post-token-response.ts';

export const authRoutes = TsRest.routes({
  getToken: {
    summary: 'Get ID and access tokens.',
    method: 'POST',
    path: '/auth/token',
    body: AuthPostTokenRequestSchema,
    responses: {
      200: AuthPostTokenResponseSchema,
      401: AuthErrorResponseSchema,
    },
  },

  updatePassword: {
    summary: 'Set the password for an email address after verifying the current password.',
    method: 'POST',
    path: '/auth/password',
    body: AuthPostPasswordRequestSchema,
    responses: {
      200: TsRest.noBody(),
      401: AuthErrorResponseSchema,
    },
  },
}, {
  strictStatusCodes: true,
});
