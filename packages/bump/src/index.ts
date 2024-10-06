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
import { type Metadata } from './types/metadata.js';
import { type Package } from './types/package.js';
import { getBump } from './utils/get-bump.js';
import { parseCommits } from './utils/parse-commits.js';
import { readFile } from './utils/read-file.js';

main(async () => {
  if (process.argv.length > 2) {
    throw new Error('Unexpected arguments.');
  }

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

  const metadata = await execNpmView(packageName, packageVersion);

  if (metadata) {
    await bump(packageVersion, metadata);
    return;
  }

  await init(packageVersion);
});

async function bump(packageVersion: string, metadata: Metadata): Promise<void> {
  const { version = '', gitHead } = metadata;

  if (!gitHead) {
    throw new Error('Missing NPM registry "gitHead" metadata.');
  }

  const commits = gitHead ? await execGitLog(gitHead) : [];

  if (commits.length === 0) {
    console.log(`Version: ${packageVersion} (no changes)`);
    return;
  }

  const messages = parseCommits(commits);
  const note = messages.length === 0 ? NOTE_VERSION_BUMP : undefined;
  const bump = getBump(messages);
  const bumpedVersion = semver.inc(version, bump);
  const newVersion = bumpedVersion && semver.gte(bumpedVersion, packageVersion)
    ? bumpedVersion
    : packageVersion;

  if (packageVersion === newVersion) {
    console.log(`Version: ${packageVersion} (no bump)`);
  }
  else {
    console.log(`Version: ${newVersion}`);
    await execNpmVersion(newVersion);
  }

  await updateChangelog(newVersion, messages, note);
}

async function init(packageVersion: string): Promise<void> {
  console.log(`Version: ${packageVersion} (initial release)`);

  await updateChangelog(packageVersion, [], NOTE_INITIAL_RELEASE);
}

async function updateChangelog(version: string, messages: Message[], note: string | undefined): Promise<void> {
  if (semver.parse(version, { loose: true })?.prerelease.length) {
    // No changelog for prerelease versions.
    return;
  }

  const changelogText = await readFile('CHANGELOG.md') ?? '';
  const newChangelogText = getChangelog(changelogText, version, messages, note);

  await fs.writeFile('CHANGELOG.md', newChangelogText);
}
