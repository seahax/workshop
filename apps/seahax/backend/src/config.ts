import assert from 'node:assert';

export const config = {
  staticPath: requireEnv('STATIC_PATH'),
  databaseUrl: requireEnv('DATABASE_URL'),
} as const;

function requireEnv(name: string): string {
  assert.ok(process.env[name], `Missing "${name}" environment variable.`);
  return process.env[name];
}
