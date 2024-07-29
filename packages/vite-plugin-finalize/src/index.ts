import path from 'node:path';
import url from 'node:url';

import { $, type ExecaScriptMethod, type Options, type TemplateExpression } from 'execa';
import { type Plugin, type ResolvedConfig, type Rollup } from 'vite';

type Callback = ($: ExecaScriptMethod, config: ResolvedConfig, bundle: Rollup.OutputBundle) => Promise<unknown>;
type TemplateArgs = [template: TemplateStringsArray, ...templateValues: readonly TemplateExpression[]];

export default function finalize(callback: Callback): Plugin;
export default function finalize(...args: TemplateArgs): Plugin;
export default function finalize(options: Options): (...args: TemplateArgs) => Plugin;
export default function finalize(...args: [callback: Callback] | [options: Options] | TemplateArgs): Plugin | ((...args: TemplateArgs) => Plugin) {
  if (typeof args[0] === 'object' && !Array.isArray(args[0])) {
    return (...templateArgs: TemplateArgs) => finalize(async ($, config) => {
      const options = args[0] as Options;
      const cwd = path.resolve(config.root, options.cwd instanceof URL
        ? url.fileURLToPath(options.cwd)
        : options.cwd ?? '.');

      return $({ ...options, cwd })(...templateArgs);
    });
  }

  const callback: Callback = typeof args[0] === 'function'
    ? args[0]
    : async ($) => $(...args as TemplateArgs);

  let resolvedConfig: ResolvedConfig;

  return {
    name: 'finalize',
    apply: 'build',
    enforce: 'post',
    configResolved(config) {
      resolvedConfig = config;
    },
    async writeBundle(_, bundle) {
      await callback($({ cwd: resolvedConfig.root, stdout: 'inherit' }), resolvedConfig, bundle);
    },
  };
}

void finalize(async ($) => {
  await $`tsc -b`;
});
