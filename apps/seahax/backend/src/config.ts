import assert from 'node:assert';

const AUTH_DB_NAME = 'auth';

export const config = {
  staticPath: requireEnv('STATIC_PATH'),
  authDbCaCert: process.env.DB_CA_CERT,
  authDbUrl: getAuthDbUrl(),
} as const;

function requireEnv(name: string): string {
  assert.ok(process.env[name], `Missing "${name}" environment variable.`);
  return process.env[name];
}

function getAuthDbUrl(): string {
  const url = new URL(requireEnv('DB_URL'));
  url.pathname = `/${AUTH_DB_NAME}`;
  return url.href;
}
