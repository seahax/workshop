import fs from 'node:fs/promises';
import path from 'node:path';

import JSON from 'json5';
import { tsImport } from 'tsx/esm/api';
import YAML from 'yaml';

type Result =
  | [data: Record<string, unknown>, filename: string]
  | [data: undefined, filename: string]
  | [data: undefined, filename: undefined];

const CONFIG_EXTENSIONS = ['', '.ts', '.mts', '.cts', '.js', '.mjs', '.cjs', '.json', '.yaml', '.yml'] as const;

export async function load(prefix: string): Promise<Result> {
  const filename = await getFilename(prefix);

  if (filename == null) return [undefined, undefined];

  const data = await getData(filename);

  return [data, filename];
}

async function getFilename(prefix: string): Promise<string | undefined> {
  const base = path.resolve(prefix);

  for (const ext of CONFIG_EXTENSIONS) {
    if (await fs.access(`${base}${ext}`).then(() => true, () => false)) {
      return `${base}${ext}`;
    }
  }
}

async function getData(filename: string): Promise<Record<string, unknown> | undefined> {
  switch (path.extname(filename)) {
    case '.ts':
    case '.mts':
    case '.cts': {
      return await tsImport(filename, import.meta.url);
    }
    case '.js':
    case '.mjs':
    case '.cjs': {
      return await import(filename);
    }
    case '.json': {
      return { default: JSON.parse(await fs.readFile(filename, 'utf8')) ?? {} };
    }
    case '.yaml':
    case '.yml': {
      return { default: YAML.parse(await fs.readFile(filename, 'utf8')) ?? {} };
    }
    default: {
      return undefined;
    }
  }
}
