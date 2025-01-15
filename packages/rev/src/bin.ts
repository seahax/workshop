import { assert } from 'node:console';

import { main } from '@seahax/main';
import chalk from 'chalk';
import semver from 'semver';

import { getGitIsClean } from './get-git-is-clean.js';
import { getGitLogs } from './get-git-logs.js';
import { getNextVersion } from './get-next-version.js';
import { getNpmMetadata } from './get-npm-metadata.js';
import { getPackageJson } from './get-package-json.js';
import { updateChangelog } from './update-changelog.js';
import { updatePackageJson } from './update-package-json.js';

await main(async () => {
  const packageJson = await getPackageJson();

  if (packageJson.private) return;

  assert(await getGitIsClean(), 'Git working directory is not clean.');
  const npmMetadata = await getNpmMetadata(packageJson);
  const logs = npmMetadata
    ? await getGitLogs(npmMetadata)
    : [];
  const nextVersion = getNextVersion(packageJson, npmMetadata, logs);
  const isPrereleaseVersion = semver.prerelease(nextVersion) != null;

  await updatePackageJson(nextVersion);

  if (!isPrereleaseVersion) {
    await updateChangelog(nextVersion, logs);
  }

  console.log(
    chalk.blue(`${packageJson.name}:`)
    + chalk.dim(` ${packageJson.version} -> `)
    + chalk.whiteBright(nextVersion),
  );
});
