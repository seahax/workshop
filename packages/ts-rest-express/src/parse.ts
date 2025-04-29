import { isZodType } from '@ts-rest/core';
import type { SafeParseReturnType } from 'zod';

/**
 * Parse the data if a Zod type was provided. Otherwise, just cast the data to
 * the expected type.
 */
export function parse(type: unknown, data: unknown): SafeParseReturnType<any, any> {
  return isZodType(type)
    ? type.safeParse(data)
    : { success: true, data };
}
