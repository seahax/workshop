import { type ESLint, type Linter } from 'eslint';

import { NAMESPACE } from './constants/namespace.js';
import { type Options } from './options.js';
import ruleArray from './rules/array.js';
import ruleChain from './rules/chain.js';
import ruleExport from './rules/export.js';
import ruleFunction from './rules/function.js';
import ruleImport from './rules/import.js';
import ruleObject from './rules/object.js';
import ruleTernary from './rules/ternary.js';
import ruleUnion from './rules/union.js';

interface Plugin extends ESLint.Plugin {
  config: (options?: Options) => Linter.Config;
}

const rules = {
  import: ruleImport,
  export: ruleExport,
  function: ruleFunction,
  object: ruleObject,
  array: ruleArray,
  ternary: ruleTernary,
  union: ruleUnion,
  chain: ruleChain,
} as const;

const plugin = {
  rules,
  configs: {
    get recommended(): Linter.Config {
      return {
        plugins: {
          [NAMESPACE]: plugin,
        },
        rules: {
          [`${NAMESPACE}/import`]: 'warn',
          [`${NAMESPACE}/export`]: 'warn',
          [`${NAMESPACE}/function`]: 'warn',
          [`${NAMESPACE}/object`]: 'warn',
          [`${NAMESPACE}/array`]: 'warn',
          [`${NAMESPACE}/ternary`]: 'warn',
          [`${NAMESPACE}/union`]: 'warn',
          [`${NAMESPACE}/chain`]: 'warn',
        } satisfies Record<`${typeof NAMESPACE}/${keyof typeof rules}`, 'warn'>,
      };
    },
  },
  config: (options: Options = {}): Linter.Config => {
    return {
      ...plugin.configs.recommended,
      settings: {
        [NAMESPACE]: options,
      },
    };
  },
} as const satisfies Plugin;

export default plugin;
