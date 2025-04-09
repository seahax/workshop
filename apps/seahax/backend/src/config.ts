import assert from 'node:assert';

import { MongoClient } from 'mongodb';

const now = Date.now();

export const config = {
  commit: process.env.APP_COMMIT ?? 'development',
  buildTimestamp: process.env.APP_BUILD_TIMESTAMP
    ? Number.parseInt(process.env.APP_BUILD_TIMESTAMP, 10) * 1000
    : now,
  startTimestamp: now,
  origin: requireEnv('APP_ORIGIN'),
  staticPath: requireEnv('APP_STATIC_PATH'),
  pepper: requireEnv('APP_PEPPER'),
  mongo: new MongoClient(requireEnv('APP_DATABASE_URL')),
} as const;

function requireEnv(name: string): string {
  assert.ok(process.env[name], `Missing "${name}" environment variable.`);
  return process.env[name];
}
