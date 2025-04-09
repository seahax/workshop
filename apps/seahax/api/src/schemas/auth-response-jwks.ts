import { z } from 'zod';

const ES256Schema = z.object({
  alg: z.literal('ES256'),
  kty: z.literal('EC'),
  use: z.literal('sig'),
  kid: z.string(),
  key_ops: z.array(z.literal('verify')),
  crv: z.literal('P-256'),
  x: z.string(),
  y: z.string(),
});

export const AuthResponseJwksSchema = z.object({
  keys: z.array(ES256Schema),
});
