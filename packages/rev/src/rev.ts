import assert from 'node:assert';

import semver from 'semver';

import { getGitIsClean } from './get-git-is-clean.ts';
import { getGitLogs, type GitLog } from './get-git-logs.ts';
import { getNextVersion } from './get-next-version.ts';
import { getNpmMetadata } from './get-npm-metadata.ts';
import { getPackageJson } from './get-package-json.ts';
import { updateChangelog } from './update-changelog.ts';
import { updatePackageJson } from './update-package-json.ts';

interface ResultPrivate {
  readonly state: 'private';
  readonly dir: string;
}

interface ResultUnchanged {
  readonly state: 'unchanged';
  readonly dir: string;
}

interface ResultChanged {
  readonly state: 'changed';
  readonly dir: string;
  readonly versions: { readonly from: string; readonly to: string };
  readonly logs: readonly Pick<GitLog, 'fullText'>[];
  readonly commit: () => Promise<void>;
}

export type Result = ResultPrivate | ResultUnchanged | ResultChanged;

export async function rev({
  dir,
  force,
  allowDirty,
}: { dir: string; force: boolean; allowDirty: boolean }): Promise<Result> {
  const packageJson = await getPackageJson({ dir });

  if (packageJson.private) return { state: 'private', dir };

  const npmMetadata = await getNpmMetadata(packageJson);
  const logs = npmMetadata
    ? await getGitLogs({ dir, name: packageJson.name, gitHead: npmMetadata.gitHead })
    : [];

  if (!force && logs.length === 0 && npmMetadata) {
    return { state: 'unchanged', dir };
  }

  assert.ok(allowDirty || await getGitIsClean({ dir }), 'Git working directory is not clean.');

  const nextVersion = getNextVersion({
    packageVersion: packageJson.version,
    npmVersion: npmMetadata?.version,
    logs,
  });
  const isPrereleaseVersion = semver.prerelease(nextVersion) != null;

  return {
    state: 'changed',
    dir,
    versions: { from: packageJson.version, to: nextVersion },
    logs,
    commit: async () => {
      await updatePackageJson({ dir, version: nextVersion });

      if (!isPrereleaseVersion) {
        await updateChangelog({ dir, version: nextVersion, logs });
      }
    },
  };
}
