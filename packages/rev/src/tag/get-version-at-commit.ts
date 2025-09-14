import { execa } from 'execa';

export async function getVersionAtCommit({ commit, packageFilename }: {
  commit: string;
  packageFilename: string;
}): Promise<string | undefined> {
  const result = await execa({ stdio: 'pipe', rejects: false })`git show ${commit}:${packageFilename}`;

  if (result.exitCode !== 0) {
    return undefined;
  }

  const version = JSON.parse(result.stdout)?.version;

  if (typeof version !== 'string') {
    return undefined;
  }

  return version;
}
