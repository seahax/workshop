import { getRandomValues } from 'node:crypto';

const CHARS = 'abcdefghjkmnpqrstuwxyz0123456789';

/**
 * Cryptographically random ID which is safe to use in AWS resource names.
 *
 * A length of 24 gives a number of possibilities (1.3e36) similar to a UUID
 * (5.3e36).
 */
export function createId(length: number): string {
  return getRandomValues(new Uint8Array(Math.max(1, Math.ceil(length))))
    .reduce((acc, value) => acc + CHARS[value % CHARS.length]!, '');
}
