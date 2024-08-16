import fs from 'node:fs/promises';
import path from 'node:path';

import external from '@seahax/vite-plugin-external';
import { build, createLogger, type InlineConfig, type LogLevel, mergeConfig, type Plugin, type Rollup } from 'vite';

export interface DataOptions {
  readonly match?: RegExp | ((filename: string) => boolean);
  readonly config?: InlineConfig | ((filename: string) => InlineConfig | Promise<InlineConfig>);
}

const DEFAULT_MATCH = /\.data\.[mc]?[tj]s$/iu;

export default function plugin({ match = DEFAULT_MATCH, config = {} }: DataOptions = {}): Plugin {
  const isMatch = typeof match === 'function' ? match : (id: string) => match.test(id);
  const filenameDependencies = new Map<string, Set<string>>();

  let root: string;
  let logLevel: LogLevel | undefined;

  return {
    name: 'data',
    configResolved(config) {
      root = config.root;
      logLevel = config.logLevel;
    },
    async load(id) {
      const filename = id.replace(/\?.*$/u, '');

      if (!path.isAbsolute(filename)) return null;
      if (!isMatch(filename)) return null;

      const { dir, name } = path.parse(filename);
      const outDir = await fs.mkdtemp(path.join(dir, `.${name}-`));

      try {
        const dependencies = new Set<string>();
        const customConfig = typeof config === 'function' ? await config(filename) : config;
        const mergedConfig: InlineConfig = mergeConfig<InlineConfig, InlineConfig>(
          {
            configFile: false,
            root,
            customLogger: createLogger(logLevel === 'silent' ? 'silent' : 'error', { allowClearScreen: false }),
            plugins: [
              {
                name: 'data',
                enforce: 'pre',
                load(id) {
                  if (path.isAbsolute(id)) {
                    dependencies.add(id.replace(/\?.*$/u, ''));
                  }

                  return null;
                },
              },
              external(),
            ],
            build: {
              target: customConfig.build?.target
                ? undefined
                : ['esnext'],
              outDir,
              lib: {
                entry: filename,
                formats: customConfig.build?.lib && customConfig.build.lib.formats
                  ? undefined
                  : ['es'],
              },
              rollupOptions: {
                output: {
                  entryFileNames: '[name].mjs',
                  chunkFileNames: '[name].mjs',
                  assetFileNames: '[name][extname]',
                },
              },
            },
            resolve: {
              conditions: customConfig.resolve?.conditions
                ? undefined
                : ['node'],
            },
          },
          customConfig,
        );

        const { output: [{ fileName }] } = [await build(mergedConfig)].flat()[0] as Rollup.RollupOutput;
        const exports = await import(path.resolve(outDir, fileName));
        const statements = await Promise.all(Object.entries(exports).map(async ([key, value]) => {
          const isPromise = value instanceof Promise;
          const jsonString = JSON.stringify(await value, jsonSafeReplacer, 2);
          const suffix = isPromise ? `Promise.resolve(${jsonString})` : jsonString;
          const prefix = key === 'default' ? 'export default ' : `export const ${key} = `;

          return `${prefix}${suffix};\n`;
        }));

        filenameDependencies.set(filename, dependencies);

        return { code: statements.join('') };
      }
      finally {
        await fs.rm(outDir, { recursive: true, force: true });
      }
    },
    handleHotUpdate(ctx) {
      const invalidated = new Set(ctx.modules);

      for (const [filename, dependencies] of filenameDependencies) {
        if (dependencies.has(ctx.file)) {
          const dataModules = ctx.server.moduleGraph.getModulesByFile(filename);

          if (!dataModules) continue;

          for (const dataModule of dataModules) {
            invalidated.add(dataModule);
          }
        }
      }

      return [...invalidated];
    },
  };
}

function jsonSafeReplacer<T>(_key: string, value: T): T {
  assertJsonSafe(value);
  return value;
}

function assertJsonSafe(value: unknown): void {
  if (value === null) return;
  if (typeof value === 'string') return;
  if (typeof value === 'number' && !Number.isNaN(value)) return;
  if (typeof value === 'boolean') return;
  if (Array.isArray(value)) return;

  // Objects must have a null/null-Object prototype which indicating they are
  // not class instances, or a toJSON method which returns a JSON-safe value.
  if (typeof value === 'object') {
    if ('toJSON' in value && typeof value.toJSON === 'function') return;

    const proto = Object.getPrototypeOf(value);

    if (proto === Object.prototype) return;
    if (proto === null) return;
  }

  throw new Error(`data module exported value that is not JSON-safe`);
}
