import { webcrypto } from 'node:crypto';

import { argon2id } from 'hash-wasm';

import { config } from '../../services/config.ts';

const SALT_LENGTH_BYTES = 32;

/**
 * References:
 * - https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
 * - https://argon2-cffi.readthedocs.io/en/stable/parameters.html
 */
export const HASH_PARAMS = {
  algorithm: 'argon2id',
  iterations: 2,
  parallelism: 1,
  /** Memory size in KiB. */
  memorySize: 19456,
  /** Hash length in bytes. */
  hashLength: 32,
} as const;

export async function getPasswordHash({ password }: { password: string }): Promise<string> {
  const salt = webcrypto.getRandomValues(new Uint8Array(SALT_LENGTH_BYTES));
  const hash = await argon2id({ ...HASH_PARAMS, password, salt, secret: config.pepper });

  return hash;
}
