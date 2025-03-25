import { z } from 'zod';

export const AuthResponseSuccess = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});
