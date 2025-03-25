import { z } from 'zod';

export const AuthLoginRequest = z.object({
  email: z.string(),
  password: z.string(),
});
