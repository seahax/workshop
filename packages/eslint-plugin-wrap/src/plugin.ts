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
  readonly config: (options?: Options) => Linter.Config;
}

export interface ConfigOptions extends Options {
  readonly severity?: 'warn' | 'error';
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
      return plugin.config();
    },
  },
  config: ({ severity = 'warn', ...options }: ConfigOptions = {}): Linter.Config => {
    return {
      plugins: {
        [NAMESPACE]: plugin,
      },
      settings: {
        [NAMESPACE]: options,
      },
      rules: {
        [`${NAMESPACE}/import`]: severity,
        [`${NAMESPACE}/export`]: severity,
        [`${NAMESPACE}/function`]: severity,
        [`${NAMESPACE}/object`]: severity,
        [`${NAMESPACE}/array`]: severity,
        [`${NAMESPACE}/ternary`]: severity,
        [`${NAMESPACE}/union`]: severity,
        [`${NAMESPACE}/chain`]: severity,
      } satisfies Record<`${typeof NAMESPACE}/${keyof typeof rules}`, typeof severity>,
    };
  },
} as const satisfies Plugin;

export default plugin;
