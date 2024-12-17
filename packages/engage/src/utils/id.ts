import { getRandomValues } from 'node:crypto';

const CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789';

/**
 * Cryptographically random ID for appending to AWS resource names to prevent
 * collisions.
 *
 * - 36 character dictionary (lower case letters and numbers)
 * - 20 character ID result (UUID is 36)
 * - 1.3367494539×10³¹ possible values (UUID has 3.4028236692×10³⁸)
 */
export function id(): string {
  return getRandomValues(new Uint8Array(20))
    .reduce((acc, value) => acc + CHARS[value % CHARS.length]!, '');
}
