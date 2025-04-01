import { z } from 'zod';

export const AuthResponseTokens = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});
