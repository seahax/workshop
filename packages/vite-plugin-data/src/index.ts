import { randomUUID } from 'node:crypto';
import { rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { loadConfigFromFile, type Plugin } from 'vite';

export interface DataOptions {
  readonly match?: RegExp | ((filename: string) => boolean);
}

interface Loaded {
  readonly dependencies: string[];
  readonly exports: Record<string, unknown>;
}

const DEFAULT_MATCH = /\.data\.[mc]?[tj]s$/iu;

export default function plugin({ match = DEFAULT_MATCH }: DataOptions = {}): Plugin {
  const isMatch = typeof match === 'function' ? match : (id: string) => match.test(id);
  const filenameDependencies = new Map<string, string[]>();

  let root: string;

  return {
    name: 'data',
    configResolved(config) {
      root = config.root;
    },
    async load(id) {
      const filename = id.replace(/\?.*$/u, '');

      if (!path.isAbsolute(filename)) return null;
      if (!isMatch(filename)) return null;

      const { dependencies, exports } = await loadDateFromFile(root, filename);
      const statementPromises = Object.entries(exports).map(async ([key, value]) => getExportStatement(key, value));
      const statements = await Promise.all(statementPromises);

      filenameDependencies.set(filename, dependencies);
      dependencies.forEach((dependency) => this.addWatchFile(dependency));

      return { code: statements.join('') };
    },
    handleHotUpdate(ctx) {
      const invalidated = new Set(ctx.modules);

      for (const [filename, dependencies] of filenameDependencies) {
        if (dependencies.includes(ctx.file)) {
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

async function loadDateFromFile(root: string, filename: string): Promise<Loaded> {
  const filenameAbs = path.resolve(root, filename);
  const filenameTmp = `${tmpdir()}/vite-date-loader-${randomUUID()}.mjs`;

  await writeFile(filenameTmp, `export default () => import(${JSON.stringify(filenameAbs)});`, 'utf8');

  try {
    const loaded = await loadConfigFromFile({ command: 'build', mode: 'production' }, filenameTmp, root, 'silent');

    if (!loaded) {
      throw new Error(`Failed loading "${filename}."`);
    }

    // The last dependency should be the generated temporary loader.
    loaded.dependencies.pop();

    return {
      dependencies: loaded.dependencies,
      exports: loaded.config as Record<string, unknown>,
    };
  }
  finally {
    await rm(filenameTmp, { recursive: true, force: true });
  }
}

async function getExportStatement(key: string, value: unknown): Promise<string> {
  const isPromise = value instanceof Promise;
  const jsonString = JSON.stringify(await value, jsonSafeReplacer, 2);
  const suffix = isPromise ? `Promise.resolve(${jsonString})` : jsonString;
  const prefix = key === 'default' ? 'export default ' : `export const ${key} = `;

  return `${prefix}${suffix};\n`;
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
