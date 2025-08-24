import assert from 'node:assert';

import { MongoClient } from 'mongodb';
import { z, type ZodType } from 'zod';

const now = Date.now();

export const config = {
  buildTimestamp: process.env.APP_BUILD_TIMESTAMP
    ? Number.parseInt(process.env.APP_BUILD_TIMESTAMP, 10) * 1000
    : now,
  startTimestamp: now,
  environment: process.env.APP_ENVIRONMENT ?? 'development',
  commit: process.env.APP_COMMIT ?? 'development',
  hostname: requireEnv('APP_HOSTNAME', z.ipv4()),
  port: requireEnv('APP_PORT', z.coerce.number().min(1024).max(65535)),
  origin: requireEnv('APP_ORIGIN', z.url({ protocol: /^https?$/u })),
  staticPath: requireEnv('APP_STATIC_PATH'),
  mongo: new MongoClient(requireEnv('APP_DATABASE_URL', z.url({ protocol: /^mongodb\+srv$/u }))),
  pepper: requireEnv('APP_PEPPER', z.string().min(8)),
} as const;

function requireEnv<TType = string>(name: string, schema?: ZodType<TType>): TType {
  assert.ok(process.env[name], `Missing "${name}" environment variable.`);
  return schema ? schema.parse(process.env[name]) : process.env[name] as TType;
}
