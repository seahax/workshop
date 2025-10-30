import { $ } from 'execa';

export interface NpmMetadata {
  readonly version: string;
  readonly gitHead?: string;
}

export async function checkPublished(name: string, version: string): Promise<boolean> {
  const { stderr, exitCode } = await $({
    stdio: 'pipe',
    reject: false,
  })`npm --loglevel=info view ${name}@${version}`;

  if (exitCode !== 0) {
    if (stderr.includes('E404')) return false;

    console.error(stderr);
    // eslint-disable-next-line unicorn/no-process-exit
    process.exit(exitCode);
  }

  return true;
}
