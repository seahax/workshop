import { assert } from 'node:console';
import fs from 'node:fs/promises';

import semver from 'semver';

export interface PackageJson {
  readonly name: string;
  readonly version: string;
  readonly private?: boolean;
}

export async function getPackageJson(): Promise<PackageJson> {
  const text = await fs.readFile('package.json', 'utf8');
  const data: unknown = JSON.parse(text);

  assertValidPackageJson(data);

  return data;
}

function assertValidPackageJson(data: any): asserts data is PackageJson {
  assert(typeof data === 'object' && data != null, 'Invalid package.json file.');
  assert(data.name, 'Missing package.json "version" field.');
  assert(data.version, 'Missing package.json "version" field.');
  assert(typeof data.name === 'string', 'Invalid package.json "name" field.');
  assert(typeof data.version === 'string' && semver.valid(data.version), 'Invalid package.json "name" field.');
  assert(data.private === undefined || typeof data.private === 'boolean', 'Invalid package.json "private" field.');
}
