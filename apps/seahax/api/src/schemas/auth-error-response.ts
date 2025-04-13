import { z } from 'zod';

export const AuthErrorResponseSchema = z.object({
  error: z.string(),
});
