import { z } from 'zod';

export const AuthLoginRequestSchema = z.object({
  email: z.string(),
  password: z.string(),
});
