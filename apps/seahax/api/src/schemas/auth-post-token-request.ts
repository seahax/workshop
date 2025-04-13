import { z } from 'zod';

export const AuthPostTokenRequestSchema = z.union([
  z.object({
    type: z.literal('login'),
    email: z.string(),
    password: z.string(),
  }),
  z.object({
    type: z.literal('refresh'),
  }).strict(),
]);
