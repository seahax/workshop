import assert from 'node:assert';

import { MongoClient } from 'mongodb';

export const config = {
  origin: requireEnv('APP_ORIGIN'),
  staticPath: requireEnv('APP_STATIC_PATH'),
  pepper: requireEnv('APP_PEPPER'),
  mongo: new MongoClient(requireEnv('APP_DATABASE_URL')),
} as const;

function requireEnv(name: string): string {
  assert.ok(process.env[name], `Missing "${name}" environment variable.`);
  return process.env[name];
}
