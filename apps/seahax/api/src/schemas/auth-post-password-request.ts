import { z } from 'zod';

export const AuthPostPasswordRequestSchema = z.object({
  email: z.string(),
  password: z.string(),
  newPassword: z.string(),
});
