import { z } from 'zod';

export const AuthPostTokenResponseSchema = z.object({
  user: z.object({
    id: z.string(),
    email: z.string(),
  }).strict(),
  accessToken: z.string(),
});
