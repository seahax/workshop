import type { Linter } from 'eslint';

interface Options {
  readonly ignores?: readonly string[];
}

const value: (options?: Options) => Linter.Config[];

export default value;
export const DEFAULT_IGNORES: readonly string[];
