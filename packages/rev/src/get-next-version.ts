import semver, { type ReleaseType } from 'semver';

import { type GitLog } from './get-git-logs.js';
import { type NpmMetadata } from './get-npm-metadata.js';
import { type PackageJson } from './get-package-json.js';

type ProdReleaseType = 'patch' | 'minor' | 'major';

const RELEASE_TYPE_PRIORITY = {
  patch: 1,
  minor: 2,
  major: 3,
} as const satisfies Record<ProdReleaseType, number>;

export function getNextVersion(
  packageJson: Pick<PackageJson, 'version'>,
  npmMetadata: NpmMetadata | undefined,
  logs: readonly GitLog[],
): string {
  const isPreRelease = semver.prerelease(packageJson.version) != null;

  if (isPreRelease) return semver.inc(packageJson.version, 'prerelease')!;
  if (!npmMetadata) return semver.inc(packageJson.version, 'patch')!;

  let releaseTypeRecommended: ReleaseType = 'patch';

  for (const log of logs) {
    if (/^[^:\s]*!:/mu.test(log.subject)) {
      releaseTypeRecommended = 'major';
      break;
    }

    if (log.subject.startsWith('feat:')) {
      releaseTypeRecommended = 'minor';
    }
  }

  const releaseTypeCurrent = semver.diff(npmMetadata.version, packageJson.version) ?? 'patch';

  if (
    isProdReleaseType(releaseTypeCurrent)
    && RELEASE_TYPE_PRIORITY[releaseTypeCurrent] >= RELEASE_TYPE_PRIORITY[releaseTypeRecommended]
  ) {
    // The current package version is already high enough to satisfy the
    // recommended release type. Only a patch bump is necessary.
    releaseTypeRecommended = 'patch';
  }

  return semver.inc(packageJson.version, releaseTypeRecommended)!;
}

function isProdReleaseType(type: ReleaseType): type is ProdReleaseType {
  return type === 'patch' || type === 'minor' || type === 'major';
}
