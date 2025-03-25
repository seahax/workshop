import { z } from 'zod';

export const AuthRefreshRequest = z.object({
  refreshToken: z.string(),
});
