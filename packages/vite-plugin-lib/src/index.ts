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

type BundleDependencyType =
  | 'devDependency'
  | 'dependency'
  | 'peerDependency'
  | 'optionalDependency';

interface BundleDependency {
  /**
   * The dependency type.
   */
  readonly type: BundleDependencyType;

  /**
   * The dependency name.
   */
  readonly name: string;

  /**
   * The dependency export path.
   */
  readonly path: string;
}

interface BundleConfig {
  /**
   * Whether or not to minify the output. Defaults to `true`.
   */
  readonly minify?: boolean;

  /**
   * Whether or not to treeshake the output. Defaults to `true`.
   */
  readonly treeshake?: boolean;

  /**
   * Custom external dependency filter. If it returns `true`, the dependency is
   * excluded from the bundle (external). If it returns `false`, the dependency
   * is included in the bundle (not external).
   *
   * The default behavior is to include all dependencies in the bundle (no
   * externals).
   */
  readonly external?: (dependency: BundleDependency) => boolean;
}

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
  readonly bundle?: boolean | BundleConfig;
}

export default function plugin({
  entry = 'src/index.ts',
  runtime = 'any',
  bundle = false,
  ...libConfig
}: Config = {}): Plugin {
  const minify = bundle === true || (typeof bundle === 'object' && bundle.minify !== false);
  const treeshake = bundle === true || (typeof bundle === 'object' && bundle.treeshake !== false);

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
        config.build.minify ??= minify;
        config.build.rollupOptions.treeshake ??= treeshake;
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
    bundle: boolean | Pick<BundleConfig, 'external'>;
  }): Promise<(source: string) => boolean> {
    const packageJsonPath = await getPackageJsonPath(root);
    const text = await fs.readFile(path.resolve(root, packageJsonPath), 'utf8');
    const json = JSON.parse(text);
    const devDependencies = Object.keys({ ...json.devDependencies });
    const dependencies = Object.keys({ ...json.dependencies });
    const peerDependencies = Object.keys({ ...json.peerDependencies });
    const optionalDependencies = Object.keys({ ...json.optionalDependencies });
    const external = bundle
      ? (
          typeof bundle === 'object' && bundle.external
            ? bundle.external
            : () => false
        )
      : ({ type }: BundleDependency) => {
          assert.ok(
            type !== 'devDependency',
            'Development dependencies should not be imported unless the package is bundled.',
          );
          return true;
        };

    return (name) => {
      const moduleInfo = getModuleInfo(name);

      switch (moduleInfo.type) {
        case 'source': {
          return false;
        }
        case 'url': {
          return true;
        }
        case 'node': {
          assert.ok(runtime === 'node', 'NodeJS built-ins can only be imported when the runtime is "node".');
          return true;
        }
        default: {
          return external(moduleInfo);
        }
      }
    };

    function getModuleInfo(name: string): BundleDependency | { type: 'source' | 'node' | 'url' } {
      if (name.startsWith('node:')) return { type: 'node' };
      if (/^[a-z]+:/iu.test(name)) return { type: 'url' };

      const dependencyMatch = name.match(/^((?:@[^/]+\/)?[^/]+)(\/.*)?$/u);

      if (dependencyMatch) {
        const [, name = '', path = ''] = dependencyMatch;

        if (devDependencies.includes(name)) return { type: 'devDependency', name, path };
        if (dependencies.includes(name)) return { type: 'dependency', name, path };
        if (peerDependencies.includes(name)) return { type: 'peerDependency', name, path };
        if (optionalDependencies.includes(name)) return { type: 'optionalDependency', name, path };
      }

      // It's not a package dependency, and it matches a node built-in module,
      // so it's a node built-in even without the "node:" prefix.
      if (isBuiltin(name)) return { type: 'node' };

      return { type: 'source' };
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
