import assert from 'node:assert';
import path from 'node:path';

import type { PackageResult } from '@seahax/monorepo';
import semver from 'semver';

import { getNpmMetadata } from '../util/get-npm-metadata.ts';
import { getGitIsClean } from './get-git-is-clean.ts';
import { getGitLogs, type GitLog } from './get-git-logs.ts';
import { getNextVersion } from './get-next-version.ts';
import { updateChangelog } from './update-changelog.ts';
import { updatePackageJson } from './update-package-json.ts';

interface ResultPrivate {
  readonly state: 'private';
  readonly dir: string;
  readonly name: string;
}

interface ResultUnchanged {
  readonly state: 'unchanged' | 'unreleased';
  readonly dir: string;
  readonly name: string;
}

interface ResultChanged {
  readonly state: 'changed';
  readonly dir: string;
  readonly name: string;
  readonly versions: { readonly from: string; readonly to: string };
  readonly logs: readonly Pick<GitLog, 'fullText'>[];
  readonly commit: () => Promise<void>;
}

export type Result = ResultPrivate | ResultUnchanged | ResultChanged;

export async function update({ pkg, force, allowDirty }: {
  pkg: PackageResult;
  force: boolean;
  allowDirty: boolean;
}): Promise<Result> {
  const dir = path.dirname(pkg.filename);
  const name = pkg.data.name;

  if (typeof pkg.data.version !== 'string' || pkg.data.private) {
    return { state: 'private', dir, name };
  }

  const npmMetadata = await getNpmMetadata({ spec: `${pkg.data.name}@<=${pkg.data.version}` });

  if (!npmMetadata) {
    return { state: 'unreleased', dir, name };
  }

  const logs = await getGitLogs({ dir, name: pkg.data.name, gitHead: npmMetadata.gitHead });

  if (!force && logs.length === 0 && npmMetadata) {
    return { state: 'unchanged', dir, name };
  }

  assert.ok(allowDirty || await getGitIsClean({ dir }), 'Git working directory is not clean.');

  const nextVersion = getNextVersion({
    packageVersion: pkg.data.version,
    npmVersion: npmMetadata.version,
    logs,
  });
  const isPrereleaseVersion = semver.prerelease(nextVersion) != null;

  return {
    state: 'changed',
    dir,
    name,
    versions: { from: pkg.data.version, to: nextVersion },
    logs,
    commit: async () => {
      await updatePackageJson({ dir, version: nextVersion });

      if (!isPrereleaseVersion) {
        await updateChangelog({ dir, version: nextVersion, logs });
      }
    },
  };
}
