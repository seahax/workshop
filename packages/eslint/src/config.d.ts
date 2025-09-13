import type { Linter } from 'eslint';

interface Options {
  readonly ignores?: readonly string[];
}

export default function config(options?: Options): Linter.Config[];
export const DEFAULT_IGNORES: readonly string[];
