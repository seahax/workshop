#!/usr/bin/env node
import fs from 'node:fs/promises';

import { main } from '@seahax/main';
import semver from 'semver';

import { getChangelog } from './changelog/get-changelog.js';
import { NOTE_INITIAL_RELEASE, NOTE_VERSION_BUMP } from './constants/notes.js';
import { execGitLog } from './git/exec-git-log.js';
import { execGitStatus } from './git/exec-git-status.js';
import { execNpmVersion } from './npm/exec-npm-version.js';
import { execNpmView } from './npm/exec-npm-view.js';
import { type Message } from './types/message.js';
import { type Package } from './types/package.js';
import { getReleaseType } from './utils/get-release-type.js';
import { parseCommits } from './utils/parse-commits.js';
import { readFile } from './utils/read-file.js';

main(async () => {
  if (process.argv.length > 2) throw new Error('Unexpected arguments.');

  const [diff, packageText] = await Promise.all([
    execGitStatus(),
    readFile('package.json'),
  ]);

  if (packageText == null) throw new Error('Missing package.json file.');

  const packageJson: Package = JSON.parse(packageText);
  const { name: packageName, version: packageVersion, private: packagePrivate = false } = packageJson;

  if (!packageName) throw new Error('Missing package name.');
  if (!packageVersion) throw new Error('Missing package version.');
  if (packagePrivate) throw new Error('Private package.');
  if (diff.trim().length > 0) throw new Error('Working directory is dirty.');

  if (semver.parse(packageVersion, { loose: true }) == null) {
    console.debug('Pre-release versions are not supported.');
    return;
  }

  const metadata = await execNpmView(packageName, packageVersion);

  if (metadata) {
    const { version, gitHead } = metadata;

    if (!gitHead) throw new Error('Missing NPM registry "gitHead" metadata.');

    const result = await bump(packageVersion, version, gitHead);

    if (result) console.info(`Version bumped to ${result.version} (${result.releaseType}).`);

    return;
  }

  if (await init(packageVersion)) {
    console.info(`Changelog initialized.`);
  }
});

async function bump(
  packageVersion: string,
  version: string,
  gitHead: string,
): Promise<{ version: string; releaseType: string } | undefined> {
  const commits = await execGitLog(gitHead);

  if (commits.length === 0) {
    console.debug(`No new commits.`);
    return;
  }

  const messages = parseCommits(commits);

  if (messages.length === 0) {
    console.debug(`No new conventional commit messages.`);
    return;
  }

  const releaseType = getReleaseType(messages);
  const bumpedVersion = semver.inc(version, releaseType);
  const newVersion = bumpedVersion && semver.gte(bumpedVersion, packageVersion)
    ? bumpedVersion
    : packageVersion;
  const changelogText = await readFile('CHANGELOG.md');

  await execNpmVersion(newVersion);
  await updateChangelog(changelogText, newVersion, messages, messages.length === 0 ? NOTE_VERSION_BUMP : undefined);

  return { version: newVersion, releaseType };
}

async function init(packageVersion: string): Promise<boolean> {
  const changelogText = await readFile('CHANGELOG.md');

  if (!changelogText) return false;

  await updateChangelog(changelogText, packageVersion, [], NOTE_INITIAL_RELEASE);

  return true;
}

async function updateChangelog(
  currentText = '',
  version: string,
  messages: Message[],
  note: string | undefined,
): Promise<void> {
  const text = getChangelog(currentText, version, messages, note);

  await fs.writeFile('CHANGELOG.md', text);
}
