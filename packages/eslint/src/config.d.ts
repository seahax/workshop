import type { Config } from './types.d.ts';

interface Options {
  readonly ignores?: readonly string[];
}

export default function config(options?: Options): Config[];
export const DEFAULT_IGNORES: readonly string[];
