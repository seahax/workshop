#!/usr/bin/env node
import fs from 'node:fs/promises';

import { main } from '@seahax/main';
import semver from 'semver';

import { type Package } from './types/package.js';
import { createChangelogEntry } from './utils/create-changelog-entry.js';
import { exec } from './utils/exec.js';
import { execGitLog } from './utils/exec-git-log.js';
import { execGitStatus } from './utils/exec-git-status.js';
import { execNpmView } from './utils/exec-npm-view.js';
import { getBump } from './utils/get-bump.js';
import { getChangelogText } from './utils/get-changelog-text.js';
import { parseChangelog } from './utils/parse-changelog.js';
import { parseMessages } from './utils/parse-messages.js';

main(async () => {
  const [diff, packageText] = await Promise.all([
    execGitStatus(),
    fs.readFile('package.json', 'utf8'),
  ]);
  const packageJson: Package = JSON.parse(packageText);

  if (diff.trim().length > 0) throw new Error('Working directory is dirty.');
  if (!packageJson.name) throw new Error('Missing package name.');
  if (!packageJson.version) throw new Error('Missing package version.');
  if (packageJson.private) throw new Error('Private package.');

  const viewInfo = await execNpmView(packageJson.name, packageJson.version);

  if (!viewInfo) {
    console.log('No previous version found.');
    return;
  }

  const { version, gitHead } = viewInfo;

  if (!gitHead) {
    console.warn('WARNING: Unable to determine previous commit from NPM.');
    return;
  }

  const logs = viewInfo.gitHead ? await execGitLog(gitHead) : [];

  if (logs.length === 0) {
    console.log('No new commits.');
    return;
  }

  const messages = parseMessages(logs);

  const bump = getBump(messages);
  const bumpedVersion = semver.inc(version, bump)!;
  const newVersion = semver.lt(bumpedVersion, packageJson.version) ? packageJson.version : bumpedVersion;

  console.log(`Published Commit:  ${gitHead}`);
  console.log(`Published Version: ${version}`);
  console.log(`Package Version:   ${packageJson.version}`);
  console.log(`Bumped Version:    ${newVersion}`);

  const changelogText = await fs.readFile('CHANGELOG.md', 'utf8');
  const [changelogHeader, changelogEntries] = parseChangelog(changelogText);
  const newChangelogEntry = createChangelogEntry(newVersion, messages);
  const newChangelogText = getChangelogText(changelogHeader, [...changelogEntries, newChangelogEntry]);

  if (newVersion !== packageJson.version) {
    await exec(`npm version ${newVersion} --no-git-tag-version`);
  }

  await fs.writeFile('CHANGELOG.md', newChangelogText);
});
