import { z } from 'zod';

export const AuthSetPasswordRequestSchema = z.object({
  email: z.string(),
  password: z.string(),
  newPassword: z.string(),
});
