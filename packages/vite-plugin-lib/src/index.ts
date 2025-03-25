import assert from 'node:assert';
import fs from 'node:fs/promises';
import { isBuiltin } from 'node:module';
import path from 'node:path';

import { execa, ExecaError, type Options } from 'execa';
import JSON from 'json5';
import { createLogger, mergeConfig, type Plugin, type UserConfig } from 'vite';

type Target = 'any' | 'node' | 'web';
type Format = 'es' | 'cjs';

interface Config {
  /**
   * The library entrypoint(s).
   *
   * Default: `'src/index.ts'`
   */
  readonly entry?: string | readonly [string, ...string[]];

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
  readonly format?: Format | [Format, ...Format[]];

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
   * Additional dependency IDs that should be considered external.
   */
  readonly extraExternals?: string[];

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

const TARGET_ANY = ['es2022'];
const TARGET = {
  any: TARGET_ANY,
  node: [...TARGET_ANY, 'node20'],
  web: TARGET_ANY,
} as const satisfies Record<Target, readonly string[]>;

const ADDITIONAL_CONDITIONS = {
  any: [],
  node: ['node'],
  web: [],
} as const satisfies Record<Target, readonly string[]>;

const MAIN_FIELDS_ANY = ['module', 'jsnext:main', 'jsnext'];
const MAIN_FIELDS = {
  any: MAIN_FIELDS_ANY,
  node: MAIN_FIELDS_ANY,
  web: ['browser', ...MAIN_FIELDS_ANY],
} as const satisfies Record<Target, readonly string[]>;

const TSCONFIGS = [
  'src/tsconfig.build.json',
  'src/tsconfig.json',
  'tsconfig.build.json',
  'tsconfig.json',
] as const;

export default function plugin({
  entry = 'src/index.ts',
  target = 'any',
  format = 'es',
  bundle = false,
  packageJsonPath: maybePackageJsonPath,
  extraExternals = [],
  tsconfigPath,
  tsc = 'tsc',
}: Config = {}): Plugin {
  let root = process.cwd();
  let logger = createLogger();

  return {
    name: 'lib',
    config: {
      order: 'pre',
      async handler(configOverrides, { command }) {
        root = configOverrides.root ?? root;

        let configDefaults: UserConfig = {
          build: {
            target: [...TARGET[target]],
            sourcemap: true,
            minify: bundle,
            rollupOptions: {
              treeshake: bundle,
              output: { preserveModules: !bundle },
              external: bundle
                ? getBundleExternalCallback()
                : await getNonBundleExternalCallback(),
            },
          },
          resolve: {
            conditions: [...ADDITIONAL_CONDITIONS[target]],
            mainFields: [...MAIN_FIELDS[target]],
          },
        };

        if (command === 'build') {
          configDefaults = mergeConfig(configDefaults, {
            build: {
              lib: {
                entry: typeof entry === 'string' ? [entry] : [...entry],
                formats: typeof format === 'string' ? [format] : [...format],
                fileName: (format, entryName) => {
                  if (format === 'es') return `${entryName}.mjs`;
                  if (format === 'cjs') return `${entryName}.cjs`;
                  return `${entryName}.${format}.js`;
                },
              },
            },
          } satisfies UserConfig);
        }

        return mergeConfig(configDefaults, configOverrides);
      },
    },
    configResolved: {
      order: 'post',
      handler(config) {
        root = config.root;
        logger = config.logger;
      },
    },
    writeBundle: {
      order: 'post',
      sequential: true,
      async handler() {
        if (tsc === false) return;

        const configs = tsconfigPath == null ? TSCONFIGS : [tsconfigPath];
        const configsArgs = await Promise.allSettled(configs.map(async (filename) => {
          const text = await fs.readFile(path.resolve(root, filename), 'utf8');
          const json = JSON.parse(text);
          return json?.references ? ['--build', '--force', filename] : ['--project', filename];
        }));
        const args = configsArgs.find((result) => result.status === 'fulfilled')?.value;

        if (!args) {
          throw new Error('Missing valid Typescript config file for type checking.');
        }

        logger.info(`exec: ${tsc} ${args.join(' ')}`);

        try {
          await execa(tsc, args, { stdio: 'inherit', preferLocal: true, cwd: root } satisfies Options);
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

  function getBundleExternalCallback(): (source: string) => boolean {
    return (source) => {
      assert.ok(target === 'node' || !source.startsWith('node:'), 'Non-NodeJS targets cannot import NodeJS built-ins.');

      if (/^[a-z]+:/iu.test(source)) return true;
      if (isBuiltin(source)) return true;

      const id = source.match(/^(?:@[^/]+\/)?[^/]+/u)?.[0];

      return Boolean(id && extraExternals.includes(id));
    };
  }

  async function getNonBundleExternalCallback(): Promise<(source: string) => boolean> {
    const packageJsonPath = maybePackageJsonPath ?? await findPackageJsonPath();
    const text = await fs.readFile(path.resolve(root, packageJsonPath), 'utf8');
    const json = JSON.parse(text);
    const deps = Object.keys({ ...json.dependencies, ...json.peerDependencies, ...json.optionalDependencies });

    return (source) => {
      assert.ok(target === 'node' || !source.startsWith('node:'), 'Non-NodeJS targets cannot import NodeJS built-ins.');

      if (/^[a-z]+:/iu.test(source)) return true;
      if (isBuiltin(source)) return true;

      const id = source.match(/^(?:@[^/]+\/)?[^/]+/u)?.[0];

      return Boolean(id && (deps.includes(id) || extraExternals.includes(id)));
    };
  }

  async function findPackageJsonPath(): Promise<string> {
    async function next(dir: string): Promise<string> {
      const filename = path.resolve(dir, 'package.json');
      const exist = await fs.access(filename).then(() => true, () => false);

      if (exist) return filename;

      const nextDir = path.dirname(dir);
      assert.ok(nextDir !== dir, 'Cannot find package.json file.');

      return next(nextDir);
    }

    return next(path.resolve(root));
  }
}
