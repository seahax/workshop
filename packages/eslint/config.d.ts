import type { Linter } from 'eslint';

interface Options {
  readonly ignores?: string[];
  readonly tsconfigPath?: string;
}

const value: (options?: Options) => Linter.Config[];

export default value;
