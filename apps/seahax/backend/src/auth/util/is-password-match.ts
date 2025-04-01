import { argon2Verify } from 'hash-wasm';

import { config } from '../../config.ts';

export async function isPasswordMatch({ password, hash }: { password: string; hash: string }): Promise<boolean> {
  return await argon2Verify({ password, hash, secret: config.pepper });
}
