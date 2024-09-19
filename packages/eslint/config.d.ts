import type { Linter } from 'eslint';

interface Options {
  readonly ignores?: string[];
  readonly tsconfigPath?: string;
}

const value: (options?: Options) => Linter.FlatConfig[];

export default value;
