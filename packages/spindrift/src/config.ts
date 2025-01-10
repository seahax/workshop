import assert from 'node:assert';
import path from 'node:path';

import { z } from 'zod';

import { load } from './utils/load.js';
import { parse } from './utils/parse.js';

export interface Config {
  /**
   * The application name. Defaults to the `name` field in `package.json`.
   */
  readonly name: string;
  /**
   * The AWS region identifier where the S3 bucket and any other regional
   * resources will be deployed. Defaults to the region indicated by
   * environment variables, AWS profile, or `"us-east-2"` if no default is
   * found.
   */
  readonly region?: string;

  /**
   * AWS service account auth configuration.
   */
  readonly auth?: {
    /**
     * The AWS credentials profile to use when deploying the application.
     */
    readonly profile?: string;

    /**
     * The AWS account ID(s) where the application is allowed to be deployed.
     * If the available credentials do not match an account ID, then deployment
     * is aborted.
     */
    readonly accounts?: readonly (string | number)[];
  };

  /**
   * AWS CloudFront configuration.
   */
  readonly cdn?: {
    /**
     * The local directory to synchronize with the SPA AWS S3 bucket. Defaults to
     * `"./dist"` relative to the config file.
     */
    readonly source?: string;

    /**
     * The logging level for the CloudFront distribution. Defaults to
     * `"basic"`.
     */
    readonly logging?: 'none' | 'basic' | 'debug';

    /**
     * Set a cache control response header for files matching glob patterns.
     *
     * Example:
     * ```yaml
     * caching:
     *   "*.html": "max-age=0"
     * ```
     */
    readonly caching?: Readonly<Record<string, string>>;

    /**
     * Override the default content types for files matching glob patterns.
     *
     * Example:
     * ```yaml
     * types:
     *   "*.json": "application/json"
     * ```
     */
    readonly types?: Readonly<Record<string, string>>;

    /**
     * Custom responses for the root URL and errors. Set this to `"spa"` to
     * enable default SPA behavior.
     *
     * Default SPA responses:
     *
     * ```ts
     * {
     *   root: '/index.html',
     *   errors: {
     *     403: {
     *       path: '/index.html',
     *       status: 200,
     *     },
     *     404: {
     *       path: '/index.html',
     *       status: 200,
     *     },
     *   },
     * }
     * ```
     */
    readonly responses?: 'spa' | {
      readonly root?: string;
      readonly errors?: Readonly<Record<number, {
        readonly path: string;
        readonly status: number;
      }>>;
      readonly headers?: Readonly<Record<string, string>>;
    };

    /**
     * Custom domain names.
     */
    readonly dns?: {
      /**
       * AWS Route53 zone where alias records will be created.
       */
      readonly zone?: string;
      readonly aliases: readonly string[];
    };
  };

  /**
   * AWS S3 buckets.
   */
  readonly buckets?: Readonly<Record<string, boolean | {
    // FUTURE: Add additional bucket configuration.
  }>>;
}

export interface ResolvedConfig extends Config {
  readonly name: string;
  readonly region: string;
  readonly auth: {
    readonly accounts: readonly string[];
    readonly profile: string | undefined;
  };
  readonly cdn: {
    readonly source: string;
    readonly logging: 'none' | 'basic' | 'debug';
    readonly caching: Readonly<Record<string, string>>;
    readonly types: Readonly<Record<string, string>>;
    readonly responses: {
      readonly root?: string;
      readonly errors: Readonly<Record<`${number}`, {
        readonly path: string;
        readonly status: number;
      }>>;
      readonly headers: Readonly<Record<string, string>>;
    };
    readonly dns: {
      readonly zone?: string;
      readonly aliases: readonly string[];
    };
  };
  readonly buckets: Readonly<Record<string, {}>>;
}

export async function defineConfig(
  config: Config | Promise<Config> | (() => Config | Promise<Config>),
): Promise<Config> {
  return typeof config === 'function' ? config() : config;
}

export async function loadConfig(prefix?: string): Promise<ResolvedConfig> {
  const [exports, filename] = await load(prefix || 'engage');

  assert(filename, `Configuration file "${prefix}" not found.`);
  assert(exports, `Configuration type "${path.extname(filename)}" not supported.`);

  const { default: config } = parse(exports, zExports, (issues) => {
    throw new Error(`Configuration file "${filename}" is invalid.${issues.map((issue) => `\n  ${issue}`).join('')}`);
  });

  return {
    name: config.name,
    region: config.region ?? 'us-east-1',
    auth: {
      profile: config.auth?.profile,
      accounts: config.auth?.accounts?.map((value) => typeof value === 'number'
        ? value.toString(10).padStart(12, '0')
        : value,
      ) ?? [],
    },
    cdn: {
      source: path.resolve(path.dirname(filename), config.cdn?.source ?? './dist'),
      logging: config.cdn?.logging ?? 'basic',
      responses: config.cdn?.responses === 'spa'
        ? {
            root: '/index.html',
            errors: {
              403: { path: '/index.html', status: 200 },
              404: { path: '/index.html', status: 200 },
            },
            headers: {},
          }
        : {
            ...config.cdn?.responses,
            errors: config.cdn?.responses?.errors ?? {},
            headers: config.cdn?.responses?.headers ?? {},
          },
      caching: config.cdn?.caching ?? {},
      types: config.cdn?.types ?? {},
      dns: {
        ...config.cdn?.dns,
        aliases: config.cdn?.dns?.aliases ?? [],
      },
    },
    buckets: Object.fromEntries(
      Object.entries(config.buckets ?? {})
        .filter(([, value]) => Boolean(value))
        .map(([k, v]) => [k, typeof v === 'object' ? v : {}]),
    ),
  };
}

const zName = z.string()
  .refine((value) => /\S/u.test(value), 'Names must be non-empty strings.')
  .refine((value) => value.length < 100, 'Names must be 100 characters or less')
  .refine((value) => !value.startsWith('$'), 'Names that start with "$" are reserved.');

const zConfig: z.ZodSchema<Config> = z.object({
  name: z.string(),
  region: z.string().optional(),
  auth: z.object({
    profile: z.string().optional(),
    accounts: z.string().or(z.number()).array().optional(),
  }).strict().optional(),
  cdn: z.object({
    source: z.string().optional(),
    logging: z.enum(['none', 'basic', 'debug']).optional(),
    responses: z.literal('spa').or(z.object({
      root: z.string().optional(),
      errors: z.record(
        z.number().refine(
          (value) => value >= 400 && value <= 599,
          'A 400-599 HTTP status code is required.',
        ),
        z.object({
          path: z.string(),
          status: z.number().refine(
            (value) => value >= 200 && value <= 599,
            'A 200-599 HTTP status code is required.',
          ),
        }).strict(),
      ).optional(),
      headers: z.record(z.string()).optional(),
    })).optional(),
    caching: z.record(z.string()).optional(),
    types: z.record(z.string()).optional(),
    dns: z.object({
      zone: z.string().optional(),
      aliases: z.array(z.string()),
    })
      .strict()
      .refine((value) => {
        return !value.zone || value.aliases.every((alias) => {
          return alias === value.zone || alias.endsWith(`.${value.zone}`);
        });
      }, 'Aliases must match the zone.').optional(),
  }).strict().optional(),
  buckets: z.record(zName, z.boolean().or(z.object({}))).optional(),
}).strict().readonly();

const zExports = z.object({
  default: zConfig,
});
