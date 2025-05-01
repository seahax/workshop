import semver, { type ReleaseType } from 'semver';

import { type GitLog } from './get-git-logs.ts';

type ProdReleaseType = 'patch' | 'minor' | 'major';

const RELEASE_TYPE_PRIORITY = {
  patch: 1,
  minor: 2,
  major: 3,
} as const satisfies Record<ProdReleaseType, number>;

export function getNextVersion({
  packageVersion,
  npmVersion,
  logs,
}: { packageVersion: string; npmVersion?: string; logs: readonly GitLog[] }): string {
  const isPreRelease = semver.prerelease(packageVersion) != null;

  if (isPreRelease) return semver.inc(packageVersion, 'prerelease')!;
  if (!npmVersion) return semver.inc(packageVersion, 'patch')!;

  let releaseTypeRecommended: ReleaseType = 'patch';

  for (const log of logs) {
    if (log.breaking) {
      releaseTypeRecommended = 'major';
      break;
    }

    if (log.type === 'feat') {
      releaseTypeRecommended = 'minor';
    }
  }

  const releaseTypeCurrent = semver.diff(npmVersion, packageVersion) ?? 'patch';

  if (
    isProdReleaseType(releaseTypeCurrent)
    && RELEASE_TYPE_PRIORITY[releaseTypeCurrent] >= RELEASE_TYPE_PRIORITY[releaseTypeRecommended]
  ) {
    // The current package version is already high enough to satisfy the
    // recommended release type. Only a patch bump is necessary.
    releaseTypeRecommended = 'patch';
  }

  return semver.inc(packageVersion, releaseTypeRecommended)!;
}

function isProdReleaseType(type: ReleaseType): type is ProdReleaseType {
  return type === 'patch' || type === 'minor' || type === 'major';
}
