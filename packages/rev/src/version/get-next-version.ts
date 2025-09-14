import semver from 'semver';

import { type GitLog } from './get-git-logs.ts';

type ReleaseType = keyof typeof RELEASE;
type Release = typeof RELEASE[ReleaseType];

const RELEASE = {
  patch: { type: 'patch', priority: 1 },
  minor: { type: 'minor', priority: 2 },
  major: { type: 'major', priority: 3 },
} as const satisfies { [P in string]: { type: P; priority: number } };

export function getNextVersion({ packageVersion, npmVersion, logs }: {
  packageVersion: string;
  npmVersion: string | undefined;
  logs: readonly GitLog[];
}): string {
  const isPreRelease = semver.prerelease(packageVersion) != null;

  if (isPreRelease) return semver.inc(packageVersion, 'prerelease')!;
  if (!npmVersion) return semver.inc(packageVersion, 'patch')!;

  let recommended: Release = RELEASE.patch;

  for (const log of logs) {
    if (log.breaking && recommended.priority < RELEASE.major.priority) {
      recommended = RELEASE.major;
      break;
    }

    if (log.type === 'feat' && recommended.priority < RELEASE.minor.priority) {
      recommended = RELEASE.minor;
    }
  }

  const currentType = semver.diff(npmVersion, packageVersion) ?? 'patch';
  const current = isReleaseType(currentType) ? RELEASE[currentType] : undefined;

  if (current && current.priority >= recommended.priority) {
    // The current package version is already high enough to satisfy the
    // recommended release type. Only a patch bump is necessary.
    recommended = RELEASE.patch;
  }

  return semver.inc(packageVersion, recommended.type)!;
}

function isReleaseType(type: string): type is ReleaseType {
  return type in RELEASE;
}
