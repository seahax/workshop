import assert from 'node:assert';
import fs from 'node:fs/promises';
import { isBuiltin } from 'node:module';
import path from 'node:path';

import { type LibraryOptions, type Plugin, type UserConfig } from 'vite';

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
type DeepReadonly<T> = T extends Function
  ? T
  : T extends readonly any[]
    ? readonly DeepReadonly<T[number]>[]
    : T extends object
      ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
      : T;

type Runtime = 'any' | 'node' | 'browser';

interface Config extends Partial<DeepReadonly<LibraryOptions>> {
  /**
   * The intended runtime of the library.
   * - `node`: NodeJS only.
   * - `browser`: Web browsers only.
   * - `any`: Any of the above runtimes.
   *
   * Default: `any`
   */
  readonly runtime?: Runtime;

  /**
   * Whether to create a bundle which combines source files into fewer chunks,
   * or to preserve the module structure of the library.
   *
   * - Minification is enabled when bundling, and disabled otherwise.
   * - Treeshaking is enabled when bundling modules, and disabled otherwise.
   * - Dependencies are included (merged) when bundling, and external
   *   otherwise.
   *
   * Default: `false`
   */
  readonly bundle?: boolean;
}

export default function plugin({
  entry = 'src/index.ts',
  runtime = 'any',
  bundle = false,
  ...libConfig
}: Config = {}): Plugin {
  return {
    name: 'lib',
    config: {
      order: 'pre',
      async handler(userConfig, { command }) {
        const config = { ...userConfig, root: userConfig.root ?? process.cwd() } satisfies UserConfig;

        for (const key of Object.keys(config)) {
          userConfig[key as keyof typeof userConfig] = undefined;
        }

        config.build ??= {};
        config.build.rollupOptions ??= {};
        config.build.rollupOptions.output ??= {};
        config.resolve ??= {};

        config.build.target ??= 'es2023';
        config.build.sourcemap ??= true;
        config.build.minify ??= bundle;
        config.build.rollupOptions.treeshake ??= bundle;
        config.build.rollupOptions.external ??= await getExternal({ root: config.root, bundle });

        if (!Array.isArray(config.build.rollupOptions.output)) {
          config.build.rollupOptions.output.preserveModules ??= !bundle;
        }

        if (runtime === 'node') {
          config.resolve.conditions ??= ['node'];
        }

        if (runtime !== 'browser') {
          config.resolve.mainFields ??= ['module', 'jsnext:main', 'jsnext'];
        }

        if (command === 'build' && config.build.lib !== false) {
          config.build.lib ??= { ...libConfig, entry } as LibraryOptions;
          config.build.lib.formats ??= ['es'];
          config.build.lib.fileName = (format, entryName) => {
            if (format === 'es') return `${entryName}.mjs`;
            if (format === 'cjs') return `${entryName}.cjs`;
            return `${entryName}.${format}.js`;
          };
        }

        return config;
      },
    },
  };

  async function getExternal({ root, bundle }: {
    root: string;
    bundle: boolean;
  }): Promise<(source: string) => boolean> {
    const packageJsonPath = await getPackageJsonPath(root);
    const text = await fs.readFile(path.resolve(root, packageJsonPath), 'utf8');
    const json = JSON.parse(text);
    const prodDeps = Object.keys({ ...json.dependencies, ...json.peerDependencies, ...json.optionalDependencies });
    const devDeps = Object.keys({ ...json.devDependencies });

    return (source) => {
      switch (getType(source)) {
        case 'source': {
          // Source files are never external.
          return false;
        }
        case 'dev': {
          // Development dependencies are never external, and can only be
          // imported when bundling.
          assert.ok(bundle, 'Development dependencies can only be imported when bundling.');
          return false;
        }
        case 'prod': {
          // Production dependencies are external when not bundling, and
          // not external when bundling.
          return !bundle;
        }
        case 'node': {
          // NodeJS built-ins are always external, and can only be imported
          // when the runtime is "node".
          assert.ok(runtime === 'node', 'NodeJS built-ins can only be imported when the runtime is "node".');
          return true;
        }
        case 'protocol': {
          // Protocol (eg. "http:") imports are always external.
          return true;
        }
      }
    };

    function getType(source: string): 'node' | 'protocol' | 'prod' | 'dev' | 'source' {
      if (source.startsWith('node:')) return 'node';
      if (/^[a-z]+:/iu.test(source)) return 'protocol';

      const name = source.match(/^(?:@[^/]+\/)?[^/]+/u)?.[0];

      if (name) {
        if (prodDeps.includes(name)) return 'prod';
        if (devDeps.includes(name)) return 'dev';
      }

      // It's not a prod or dev dependency, and it matches a node built-in
      // module, so it's a node built-in even without the "node:" prefix.
      if (isBuiltin(source)) return 'node';

      return 'source';
    }
  }

  async function getPackageJsonPath(dir: string): Promise<string> {
    dir = path.resolve(dir);

    const filename = path.join(dir, 'package.json');
    const exist = await fs.access(filename).then(() => true, () => false);

    if (exist) return filename;

    const nextDir = path.dirname(dir);

    assert.ok(nextDir !== dir, 'Cannot find package.json file.');

    return await getPackageJsonPath(nextDir);
  }
}
