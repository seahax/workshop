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

type DependencyType = 'dependencies' | 'peerDependencies' | 'optionalDependencies' | 'devDependencies';

interface DependencyInfo {
  /**
   * The dependency type, which is the key under which the dependency is found
   * in the `package.json` file.
   */
  readonly type: DependencyType;

  /**
   * The dependency name, as found in the `package.json` file.
   */
  readonly name: string;
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
   * `false` per dependency. Defaults to `true`.
   *
   * **NOTE:** This only affects production dependencies. Production
   * dependencies are the packages referenced by `package.json` file
   * `dependencies`, `peerDependencies`, and `optionalDependencies`.
   */
  readonly includeDependencies?: boolean | ((info: DependencyInfo) => boolean);
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
          config.build.lib.fileName ??= (format, entryName) => {
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
      const info = getSourceInfo(source);

      switch (info.type) {
        case 'source': {
          return false;
        }
        case 'dependencies':
        case 'peerDependencies':
        case 'optionalDependencies': {
          return !includeDependency(info);
        }
        case 'devDependencies': {
          assert.ok(
            bundle,
            `Development dependency "${info.name}" should not be imported unless the package is bundled.`,
          );
          return false;
        }
        case 'node': {
          assert.ok(
            runtime === 'node',
            `NodeJS built-in "${source}" should not be imported unless the runtime is "node".`,
          );
          return true;
        }
        case 'url': {
          return true;
        }
      }
    };

    function getIncludeDependency(): ((info: DependencyInfo) => boolean) {
      const includeDependencies = typeof bundle === 'object'
        ? bundle.includeDependencies ?? true
        : bundle;

      return typeof includeDependencies === 'boolean'
        ? () => includeDependencies
        : includeDependencies;
    }

    function getSourceInfo(
      source: string,
    ): { type: 'source' | 'node' | 'url'; name?: undefined } | DependencyInfo {
      if (source.startsWith('node:')) return { type: 'node' };
      if (/^[a-z]+:/iu.test(source)) return { type: 'url' };

      const name = source.match(/^(?:@[^/]+\/)?[^/]+/u)?.[0];

      if (name) {
        // This ordering matters, because a package name may exist in more than
        // one package.json dependencies object.
        if (dependencies.includes(name)) return { type: 'dependencies', name };
        if (peerDependencies.includes(name)) return { type: 'peerDependencies', name };
        if (optionalDependencies.includes(name)) return { type: 'optionalDependencies', name };
        if (devDependencies.includes(name)) return { type: 'devDependencies', name };
      }

      // It's not a package dependency, and it matches a node built-in module,
      // so it's a node built-in even without the "node:" prefix.
      if (isBuiltin(source)) return { type: 'node' };

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
