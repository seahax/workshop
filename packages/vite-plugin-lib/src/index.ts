import fs from 'node:fs/promises';
import { isBuiltin } from 'node:module';
import path from 'node:path';

import { execa, ExecaError, type Options } from 'execa';
import { createLogger, mergeConfig, type Plugin, type UserConfig } from 'vite';

type Target = 'any' | 'node' | 'web';
type Format = 'es' | 'cjs';

interface Config {
  /**
   * The library entrypoint(s).
   *
   * Default: `'src/index.ts'`
   */
  readonly entry?: string | string[];

  /**
   * The target environment for the library.
   * - `any`: Both NodeJS and web browsers.
   * - `node`: NodeJS only.
   * - `web`: Web browsers only.
   *
   * Default: `'any'`
   */
  readonly target?: Target;

  /**
   * The library formats to build.
   * - `es`: ECMAScript modules.
   * - `cjs`: CommonJS modules.
   *
   * Default: `['es']`
   */
  readonly formats?: Format[];

  /**
   * Whether to create a bundle which combines source files into fewer chunks,
   * or to preserve the module structure of the library.
   *
   * - Minification is enabled when bundling, and disabled otherwise.
   * - Treeshaking is enabled when bundling modules, and disabled otherwise.
   * - Dependencies are included when bundling, and externalized otherwise.
   *
   * Default: `false`
   */
  readonly bundle?: boolean;

  /**
   * The path to the `package.json` file used to determine which dependencies
   * should be external.
   *
   * Default: `` `${config.root}/package.json` ``
   */
  readonly packageJsonPath?: string;

  /**
   * The path of the TypeScript configuration file used for type-checking and
   * (optionally) generating declaration files.
   *
   * Default picked from the following (in order):
   * - `` `${config.root}/src/tsconfig.json` ``
   * - `` `${config.root}/tsconfig.json` ``
   */
  readonly tsconfigPath?: string;

  /**
   * The Typescript compiler command used to type-checking and (optionally)
   * generating declaration files. Set to `false` to disable running the
   * Typescript compiler.
   *
   * Must accept the arguments: `--force --build <tsconfigPath>`.
   *
   * Default: `'tsc'`
   */
  readonly tsc?: false | string;
}

const TARGET = {
  any: ['es2022'],
  node: ['node22'],
  web: ['es2022'],
} as const satisfies Record<Target, string[]>;

const TSCONFIGS = ['src/tsconfig.json', 'tsconfig.json'] as const;

export default function plugin({
  entry = 'src/index.ts',
  target = 'any',
  formats = ['es'],
  bundle = false,
  packageJsonPath = 'package.json',
  tsconfigPath,
  tsc = 'tsc',
}: Config = {}): Plugin {
  let root = process.cwd();

  return {
    name: 'lib',
    async config(configOverrides, { command }) {
      root = configOverrides.root ?? root;

      let configDefaults: UserConfig = {
        build: {
          target: TARGET[target],
          sourcemap: true,
          minify: false,
          rollupOptions: {
            treeshake: false,
            output: { preserveModules: true },
          },
        },
        resolve: {
          mainFields: ['module', 'jsnext:main', 'jsnext'],
        },
      };

      if (target === 'node') {
        configDefaults = mergeConfig(configDefaults, {
          resolve: {
            conditions: ['node'],
          },
        } satisfies UserConfig);
      }
      else if (target === 'web') {
        configDefaults = mergeConfig(configDefaults, {
          resolve: {
            mainFields: ['browser', 'module', 'jsnext:main', 'jsnext'],
          },
        } satisfies UserConfig);
      }

      if (command === 'build') {
        configDefaults = mergeConfig(configDefaults, {
          build: {
            lib: {
              entry,
              formats,
              fileName: (format, entryName) => {
                if (format === 'es') return `${entryName}.mjs`;
                if (format === 'cjs') return `${entryName}.cjs`;
                return `${entryName}.${format}.js`;
              },
            },
          },
        } satisfies UserConfig);
      }

      if (bundle) {
        configDefaults = mergeConfig(configDefaults, {
          build: {
            minify: true,
            rollupOptions: {
              treeshake: true,
              output: { preserveModules: false },
            },
          },
        } satisfies UserConfig);
      }
      else {
        configDefaults = mergeConfig(configDefaults, {
          build: {
            rollupOptions: {
              external: await getExternalCallback(root, packageJsonPath),
            },
          },
        } satisfies UserConfig);
      }

      return mergeConfig(configDefaults, configOverrides);
    },
    configResolved(config) {
      root = config.root;
    },
    writeBundle: {
      sequential: true,
      order: 'post',
      async handler() {
        if (tsc === false) return;

        const configs = tsconfigPath == null ? TSCONFIGS : [tsconfigPath];
        const results = await Promise.all(configs.map(async (filename) => {
          filename = path.resolve(root, filename);
          return { filename, access: await fs.access(filename).then(() => true, () => false) };
        }));
        const config = results.find((result) => result.access)?.filename;

        if (config == null) {
          throw new Error('Missing Typescript config file.');
        }

        createLogger().info(`exec: ${tsc} --build --force ${path.relative(root, config)}`);

        try {
          await execa(
            tsc,
            ['--build', '--force', config],
          { stdio: 'inherit', preferLocal: true, cwd: root } satisfies Options,
          );
        }
        catch (error) {
          if (error instanceof ExecaError && error.exitCode !== 0) {
            process.exitCode ||= error.exitCode;
          }
          else {
            throw error;
          }
        }
      },
    },
  };
}

async function getExternalCallback(root: string, packageJsonPath: string): Promise<(source: string) => boolean> {
  const text = await fs.readFile(path.resolve(root, packageJsonPath), 'utf8');
  const json = JSON.parse(text);
  const deps = Object.keys({ ...json.dependencies, ...json.peerDependencies, ...json.optionalDependencies });

  return (source) => {
    if (source.startsWith('node:')) return true;
    if (isBuiltin(source)) return true;

    const id = source.match(/^(?:@[^/]+\/)?[^/]+/u)?.[0];

    return Boolean(id && deps.includes(id));
  };
}
