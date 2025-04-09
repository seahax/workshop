import { z } from 'zod';

export const AuthResponseTokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});
