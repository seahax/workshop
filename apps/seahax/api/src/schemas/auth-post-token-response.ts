import { z } from 'zod';

export const AuthPostTokenResponseSchema = z.object({
  idToken: z.string(),
  accessToken: z.string(),
});
