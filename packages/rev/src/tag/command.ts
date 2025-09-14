#!/usr/bin/env node
import path from 'node:path';

import { alias, createHelp, cue, option, parseOptions } from '@seahax/args';
import { getPackages } from '@seahax/monorepo';
import chalk from 'chalk';

import { createGitTag } from './create-git-tag.ts';
import { getDefaultTagSuffix } from './get-default-tag-suffix.ts';
import { getVersionAtCommit } from './get-version-at-commit.ts';

const help = createHelp`
{bold Usage:} rev tag {blue [options]}

Create an annotated Git tag for a release commit.

The tag name will be "release-<ISO_8601_DateTime>". The tag message will
contain a list of the packages with changed versions and their new versions.

  Tag Name: release-20250914T213442Z
  Tag Message:
    - package-a@1.2.3
    - package-b@4.5.6

If no commit hash is provided, the current commit (HEAD) is used. The commit
must be a release commit, which means that it must contain a version bump in
at least one package, or the command will fail.

{bold Options:}
  {blue --commit, -c}   The commit to tag (default: HEAD).
  {blue --suffix, -s}   Override the tag suffix (default: ISO 8601 DateTime).
  {blue --help, -h}     Show this help message.
`;

export async function tagCommand(args: string[]): Promise<void> {
  const options = await parseOptions(args, {
    '--commit': option(),
    '-c': alias('--commit'),
    '--suffix': option(),
    '-s': alias('--suffix'),
    '--help': cue(),
    '-h': alias('--help'),
  });

  if (options.value === '--help') return help().exit();
  if (options.issues) return help.error`{red ${options.issues[0]}}`.exit(1);

  const {
    '--commit': commit = 'HEAD',
    '--suffix': suffix = getDefaultTagSuffix(),
  } = options.value;

  const packages = await getPackages(process.cwd());
  const results = await Promise.all(packages.map(async (pkg): Promise<string | undefined> => {
    const packageFilename = path.relative(process.cwd(), pkg.filename);
    const [version, previousVersion] = await Promise.all([
      getVersionAtCommit({ commit, packageFilename }),
      getVersionAtCommit({ commit: `${commit}^`, packageFilename }),
    ]);

    // Package doesn't exist (or has no version) at the commit.
    if (!version) return;
    // Version wasn't changed at the commit.
    if (version === previousVersion) return;

    return `${pkg.data.name}@${version}`;
  }));
  const changes = results.filter((result): result is string => result != null);

  if (changes.length === 0) {
    console.error(chalk.red(`Commit "${commit}" is not a release (no package version changes)`));
    process.exit(1);
  }

  const tagName = `release-${suffix}`;
  const tagMessage = changes.map((change) => `- ${change}`).join('\n');
  const tagExitCode = await createGitTag({ tag: tagName, message: tagMessage, commit });

  if (tagExitCode !== 0) {
    process.exit(tagExitCode);
  }

  console.log(chalk.blue(`${tagName} (${commit}):`));
  console.log(chalk.gray(tagMessage));
}
