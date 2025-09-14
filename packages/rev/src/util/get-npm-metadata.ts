import { $ } from 'execa';
import semver from 'semver';

export interface NpmMetadata {
  readonly version: string;
  readonly gitHead: string;
}

export async function getNpmMetadata({ spec }: { spec: string }): Promise<NpmMetadata | undefined> {
  const { stdout, stderr, stdio, exitCode } = await $({
    stdio: 'pipe',
    reject: false,
  })`npm view ${spec} name version gitHead --json`;

  if (exitCode !== 0) {
    if (stderr.includes('E404')) return;

    console.error(stdio);
    process.exitCode = exitCode;
    throw new Error('NPM view failed.');
  }

  const data: NpmMetadata | NpmMetadata[] = JSON.parse(stdout);
  const entries = Array.isArray(data) ? data : [data];
  const closest = entries
    .filter((entry) => entry.gitHead)
    .sort((a, b) => semver.compare(b.version, a.version)).at(0);

  return closest;
}
