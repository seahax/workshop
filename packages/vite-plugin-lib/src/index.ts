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

type BundleDependencyType = 'dependency' | 'peerDependency' | 'optionalDependency';

interface BundleDependency {
  /**
   * The dependency type.
   */
  readonly type: BundleDependencyType;

  /**
   * The dependency source as passed ot the Rollup Options `external` callback.
   * This may include an exports path in addition to the base module name (eg.
   * `react-dom/client`)
   */
  readonly source: string;
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
   * Whether to include _production_ dependencies in the bundle, or leave them
   * external. Also accepts a callback function that can return `true` or
   * `false` per dependency. Defaults to `false`.
   *
   * **NOTE:** This only affects production dependencies. Production
   * dependencies are the packages referenced by `package.json` file
   * `dependencies`, `peerDependencies`, and `optionalDependencies`.
   */
  readonly includeDependencies?: boolean | ((dependency: BundleDependency) => boolean);
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
   * - Dependencies are included in the bundle by default.
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
    bundle: boolean | Pick<BundleConfig, 'includeDependencies'>;
  }): Promise<(source: string) => boolean> {
    const packageJsonPath = await getPackageJsonPath(root);
    const text = await fs.readFile(path.resolve(root, packageJsonPath), 'utf8');
    const json = JSON.parse(text);
    const devDependencies = Object.keys({ ...json.devDependencies });
    const dependencies = Object.keys({ ...json.dependencies });
    const peerDependencies = Object.keys({ ...json.peerDependencies });
    const optionalDependencies = Object.keys({ ...json.optionalDependencies });
    const includeDependency = getIncludeDependency();

    return (source) => {
      const type = getSourceType(source);

      switch (type) {
        case 'other':
        case 'source': {
          return false;
        }
        case 'url': {
          return true;
        }
        case 'node': {
          assert.ok(runtime === 'node', 'NodeJS built-ins should not be imported unless the runtime is "node".');
          return true;
        }
        case 'devDependency': {
          assert.ok(bundle, 'Development dependencies should not be imported unless the package is bundled.');
          return false;
        }
        case 'dependency':
        case 'peerDependency':
        case 'optionalDependency': {
          const external = !includeDependency({ type, source });
          return external;
        }
      }
    };

    function getIncludeDependency(): ((dependency: BundleDependency) => boolean) {
      if (typeof bundle === 'boolean') return () => bundle;
      if (typeof bundle.includeDependencies === 'function') return bundle.includeDependencies;
      if (bundle.includeDependencies === false) return () => false;
      return () => true;
    }

    function getSourceType(
      source: string,
    ): 'source' | 'node' | 'url' | 'other' | 'devDependency' | BundleDependencyType {
      if (/^\.{1,2}\//u.test(source) || path.isAbsolute(source)) return 'source';
      if (source.startsWith('node:')) return 'node';
      if (/^[a-z]+:/iu.test(source)) return 'url';

      const name = source.match(/^(?:@[^/]+\/)?[^/]+/u)?.[0];

      if (name) {
        // This ordering matters, because a package name may exist in more than
        // one package.json dependencies object.
        if (dependencies.includes(name)) return 'dependency';
        if (peerDependencies.includes(name)) return 'peerDependency';
        if (optionalDependencies.includes(name)) return 'optionalDependency';
        if (devDependencies.includes(name)) return 'devDependency';
      }

      // It's not a package dependency, and it matches a node built-in module,
      // so it's a node built-in even without the "node:" prefix.
      if (isBuiltin(source)) return 'node';

      return 'other';
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
