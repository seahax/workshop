import fs from 'node:fs/promises';
import path from 'node:path';

import JSON from 'json5';
import { tsImport } from 'tsx/esm/api';
import YAML from 'yaml';
import { z } from 'zod';

import { type Config, type ResolvedConfig } from './types/config.js';

const CONFIG_EXTENSIONS = ['', '.ts', '.mts', '.cts', '.js', '.mjs', '.cjs', '.json', '.yaml', '.yml'] as const;

export async function defineConfig(
  config: Config | Promise<Config> | (() => Config | Promise<Config>),
): Promise<Config> {
  return typeof config === 'function' ? config() : config;
}

export async function resolveConfig(filenameBase: string | undefined): Promise<ResolvedConfig> {
  const filename = await findConfig(filenameBase);
  const config = await loadConfig(filename);
  const rootDir = path.dirname(filename);
  const self = getResolvedConfig(config, rootDir);

  return self;
}

async function findConfig(filenameBase: string | undefined): Promise<string> {
  const base = path.resolve(filenameBase ?? 'engage');

  for (const ext of CONFIG_EXTENSIONS) {
    if (await fs.access(`${base}${ext}`).then(() => true, () => false)) {
      return `${base}${ext}`;
    }
  }

  throw new Error(`Config file "${filenameBase}" not found.`);
}

async function loadConfig(filename: string): Promise<Config> {
  let exports: unknown;

  switch (path.extname(filename)) {
    case '.ts':
    case '.mts':
    case '.cts': {
      exports = await tsImport(filename, import.meta.url);
      break;
    }
    case '.js':
    case '.mjs':
    case '.cjs': {
      exports = await import(filename);
      break;
    }
    case '.json': {
      exports = { default: JSON.parse(await fs.readFile(filename, 'utf8')) ?? {} };
      break;
    }
    case '.yaml':
    case '.yml': {
      exports = { default: YAML.parse(await fs.readFile(filename, 'utf8')) ?? {} };
      break;
    }
    default: {
      throw new Error(`Unsupported config file extension "${path.extname(filename)}".`);
    }
  }

  const result = zExports.safeParse(exports);

  if (!result.success) {
    throw new Error(
      `Config file "${filename}" is invalid.${getIssuesString(result.error.issues)}`,
      { cause: result.error },
    );
  }

  return result.data.default;
}

function getResolvedConfig(config: Config, rootDir = process.cwd()): ResolvedConfig {
  return {
    app: config.app,
    domains: config.domains ?? [],
    aws: {
      region: config.aws?.region ?? 'us-east-1',
      profile: config.aws?.profile,
      accounts: config.aws?.accounts?.map((value) => typeof value === 'number'
        ? value.toString(10).padStart(12, '0')
        : value,
      ) ?? [],
    },
    cdn: {
      source: path.resolve(rootDir, config.cdn?.source ?? './dist'),
      spa: config.cdn?.spa ?? false,
      caching: config.cdn?.caching ?? {},
      types: config.cdn?.types ?? {},
    },
  };
}

function getIssuesString(issues: z.ZodIssue[]): string {
  return issues.map((issue) => `\n  ${getPathString(issue.path)}: ${issue.message}`).join('');
}

function getPathString(path: (string | number)[]): string {
  return '$' + path.map((part) => typeof part === 'string' ? `.${part}` : `[${part}]`).join('');
}

const zConfig: z.ZodSchema<Config> = z.object({
  app: z.string().max(32).refine(
    (value) => !/[^a-z0-9_-]/u.test(value),
    'Invalid characters (allowed: lowercase letters, numbers, underscores, hyphens).',
  ),
  aws: z.object({
    region: z.string().optional(),
    profile: z.string().optional(),
    accounts: z.string().or(z.number()).array().optional(),
  }).strict().optional(),
  cdn: z.object({
    source: z.string().optional(),
    spa: z.boolean().or(z.string()).optional(),
    caching: z.record(z.string()).optional(),
    types: z.record(z.string()).optional(),
  }).strict().optional(),
  domains: z.string().array().optional(),
}).strict().readonly();

const zExports = z.object({
  default: zConfig,
});
