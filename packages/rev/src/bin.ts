import { assert } from 'node:console';

import { createCommand } from '@seahax/args';
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
  await createCommand()
    .usage('rev [options]')
    .info([
      `Conventional(-ish) versioning tool. Run the command at the root of a
      package to bump its version and update its changelog. The type of
      version bump (patch, minor, or major) is based loosely on the
      Conventional Commits spec.`,
      'Read the docs: https://github.com/seahax/workshop/blob/main/packages/rev/README.md',
    ])
    .boolean('force', 'Bump the version even if there are no new commits.')
    .action(async ({ options }) => {
      if (!options) return;

      const packageJson = await getPackageJson();

      if (packageJson.private) return;

      const npmMetadata = await getNpmMetadata(packageJson);
      const logs = npmMetadata
        ? await getGitLogs(npmMetadata)
        : [];

      if (!options.force && logs.length === 0 && npmMetadata) return;

      assert(await getGitIsClean(), 'Git working directory is not clean.');

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
    })
    .parse(process.argv.slice(2));
});
