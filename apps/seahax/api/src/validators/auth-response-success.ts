import { z } from 'zod';

export const AuthResponseError = z.object({
  error: z.string(),
});
