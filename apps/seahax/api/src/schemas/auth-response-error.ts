import { z } from 'zod';

export const AuthResponseErrorSchema = z.object({
  error: z.string(),
});
