#!/usr/bin/env node
import fs from 'node:fs/promises';
import readline from 'node:readline';

import { main } from '@seahax/main';
import chalk from 'chalk';
import { $ } from 'execa';
import semver from 'semver';

interface Package {
  name?: unknown;
  version?: unknown;
  private: unknown;
}

main(async () => {
  const packageText = await fs.readFile('package.json', 'utf8');
  const current: Package | undefined = JSON.parse(packageText);

  if (!current || typeof current.name !== 'string' || typeof current.version !== 'string') {
    throw new Error('Invalid package.json file.');
  }

  if (current.private) {
    console.log('Private package.');
    return;
  }

  const published = await getPublished(current.name, current.version);
  const logs = published ? await getLogs(published.head) : [];
  const release = logs.some(({ message }) => /^\S+!:/u.test(message))
    ? 'major'
    : (logs.some(({ message }) => message.startsWith('feat:'))
        ? 'minor'
        : 'patch');
  const isCurrentPublished = published?.version === current.version;

  if (isCurrentPublished && logs.length === 0) {
    console.log('No changes.');
    return;
  }
  const isPrerelease = Boolean(semver.parse(current.version)?.prerelease.length);
  let suggestedVersion = semver.inc(
    !published || isCurrentPublished ? current.version : published.version,
    isPrerelease ? `pre${release}` : release,
  ) ?? '';

  if (!suggestedVersion) {
    throw new Error('Current version is invalid.');
  }

  if (semver.lt(suggestedVersion, current.version)) {
    suggestedVersion = current.version;
  }

  console.log(`${chalk.bold('Package:')} ${current.name}@${current.version}`);
  console.log(chalk.bold('Changes:'));
  logs.forEach(({ hash, message }) => console.log(`  ${chalk.yellow(hash)} ${message}`));

  let newVersion: string | null;

  if (process.stdin.isTTY) {
    newVersion = await ask(chalk.bold(`Version (${suggestedVersion})? `));

    if (newVersion == null) {
      process.exitCode ||= 1;
      return;
    }

    if (newVersion) {
      if (!semver.valid(newVersion)) {
        throw new Error('Invalid version.');
      }

      if (semver[isCurrentPublished ? 'lte' : 'lt'](newVersion, current.version)) {
        throw new Error('New version must be greater than or equal to the current version.');
      }
    }
    else {
      newVersion = suggestedVersion;
    }
  }
  else {
    newVersion = suggestedVersion;
    console.log(`${chalk.bold('Version:')} ${newVersion}`);
  }

  if (newVersion === current.version) {
    return;
  }

  const indent = packageText.match(/^\s+/mu)?.[0] || '  ';

  await fs.writeFile('package.json', JSON.stringify({ ...current, version: newVersion }, null, indent) + '\n');

  const changeLog = await fs.readFile('CHANGELOG.md', 'utf8').catch((error: unknown) => {
    if ((error as any)?.code === 'ENOENT') return '';
    throw error;
  });
  const [, header, rest = ''] = changeLog.match(/^(# \S.*?(?=\n#|$))(.*)$/su) ?? [];

  const date = new Date();
  const dateString = `${String(date.getFullYear()).padStart(4, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const changeLogMessage = [
    `## ${newVersion} - ${dateString}\n`,
    ...logs.map(({ message, hash }) => `- ${message} (\`${hash}\`)`),
  ].join('\n');

  await fs.writeFile('CHANGELOG.md', [
    header?.trim() || '# Changelog',
    changeLogMessage,
    rest.trim(),
  ].filter(Boolean).join('\n\n') + '\n');
});

async function getPublished(name: string, currentVersion: string): Promise<null | { head: string; version: string }> {
  const { stdout, stderr, stdio, exitCode } = await $({
    stdio: 'pipe',
    reject: false,
  })`npm view ${`${name}@<=${currentVersion}`} name version gitHead --json`;

  if (exitCode !== 0) {
    if (stderr.includes('E404')) return null;
    console.error(stdio);
    process.exitCode = exitCode;
    throw new Error('NPM view failed.');
  }

  const results = JSON.parse(stdout);
  const closest = Array.isArray(results)
    ? results.sort((a, b) => semver.compare(b.version, a.version)).at(0)
    : results;

  return { head: closest.gitHead, version: closest.version };
}

async function getLogs(publishedHead: string): Promise<{ hash: string; message: string }[]> {
  const { stdout } = await $({
    stdout: 'pipe',
  })`git log ${'--pretty=format:%C(yellow)%h%C(reset) %s'} ${publishedHead}..HEAD -- .`;

  return stdout.split('\n').filter(Boolean).flatMap((line) => {
    const match = line.match(/^\s*([a-f0-9]+)\s+(?=\S)(.+?)(?<=\S)\s*?$/mu);
    return match ? { hash: match[1]!, message: match[2]! } : [];
  });
}

async function ask(question: string): Promise<string | null> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  try {
    return await new Promise<string | null>((resolve) => {
      rl.question(question, (value) => resolve(value));
      rl.on('SIGINT', () => {
        console.log(chalk.gray('aborted'));
        resolve(null);
      });
    });
  }
  finally {
    rl.close();
  }
}
