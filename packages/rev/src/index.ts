#!/usr/bin/env node
import fs from 'node:fs/promises';
import readline from 'node:readline';

import { main } from '@seahax/main';
import chalk from 'chalk';
import { $ } from 'execa';
import semver, { type ReleaseType } from 'semver';

interface Package {
  readonly name: string;
  readonly version: string;
  readonly private?: boolean;
}

interface Info {
  readonly head: string;
  readonly version: string;
}

interface Log {
  readonly hash: string;
  readonly message: string;
}

await main(async () => {
  const current = await readPackage();

  if (current.private) {
    console.log('Private package.');
    return;
  }

  const previous = await getInfo(current.name, current.version);
  const logs = previous ? await getLogs(previous.head) : [];
  const release = getReleaseType(logs, current.version);

  // A version is published and no release is needed.
  if (previous && release == null) {
    console.log('No changes.');
    return;
  }

  const suggestedVersion = getSuggestedVersion(previous?.version, current.version, release);
  const newVersion = await prompt(current.name, previous?.version ?? current.version, suggestedVersion, logs);

  if (newVersion == null || newVersion === current.version) {
    return;
  }

  await writePackage(newVersion);
  await writeChangelog(newVersion, logs);
});

async function readPackage(): Promise<Package> {
  const raw = await fs.readFile('package.json', 'utf8');
  const pkg = JSON.parse(raw);

  if (!isPackage(pkg)) {
    throw new Error('Invalid package.json file.');
  }

  if (semver.parse(pkg.version) == null) {
    throw new Error('Invalid package.json version.');
  }

  return pkg;
}

function isPackage(obj: undefined | Record<string, unknown> | Package): obj is Package {
  return (
    typeof obj?.name === 'string'
    && typeof obj.version === 'string'
    && (obj.private === undefined || typeof obj.private === 'boolean')
  );
}

async function getInfo(name: string, currentVersion: string): Promise<Info | null> {
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

async function getLogs(publishedHead: string): Promise<readonly Log[]> {
  const { stdout } = await $({
    stdout: 'pipe',
  })`git log ${'--pretty=format:%C(yellow)%h%C(reset) %s'} ${publishedHead}..HEAD -- .`;

  return stdout.split('\n').filter(Boolean).flatMap((line) => {
    const match = line.match(/^\s*([a-f0-9]+)\s+(?=\S)(.+?)(?<=\S)\s*?$/mu);
    return match ? { hash: match[1]!, message: match[2]! } : [];
  });
}

function getReleaseType(logs: readonly Log[], currentVersion: string): ReleaseType | null {
  if (logs.length === 0) return null;

  const prefix = semver.parse(currentVersion)?.prerelease.length ? 'pre' : '';

  if (logs.some(({ message }) => /^\S+!:/u.test(message))) return `${prefix}major`;
  if (logs.some(({ message }) => message.startsWith('feat:'))) return `${prefix}minor`;

  return `${prefix}patch`;
}

function getSuggestedVersion(
  previousVersion: string | undefined,
  currentVersion: string,
  release: ReleaseType | null,
): string {
  if (!release) return currentVersion;

  if (previousVersion) {
    const suggestedVersion = semver.inc(previousVersion, release)!;

    return semver.lt(suggestedVersion, currentVersion)
      ? currentVersion
      : suggestedVersion;
  }

  return semver.inc(currentVersion, release)!;
}

async function prompt(
  name: string,
  previousVersion: string,
  suggestedVersion: string,
  logs: readonly Log[],
): Promise<string | null> {
  console.log(`${chalk.bold('Package:')} ${name}@${previousVersion}`);
  console.log(chalk.bold('Changes:'));
  logs.forEach(({ hash, message }) => console.log(`  ${chalk.yellow(hash)} ${message}`));

  if (process.stdin.isTTY) {
    const newVersion = await ask(chalk.bold(`Version (${suggestedVersion})? `));

    if (newVersion == null) {
      process.exitCode ||= 1;
      return null;
    }

    if (newVersion) {
      if (!semver.valid(newVersion)) {
        throw new Error('Invalid version.');
      }

      if (semver.lte(newVersion, previousVersion)) {
        throw new Error('Version must be greater than the previously published version.');
      }

      return newVersion;
    }
    else {
      return suggestedVersion;
    }
  }

  console.log(`${chalk.bold('Version:')} ${suggestedVersion}`);

  return suggestedVersion;
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

async function writePackage(version: string): Promise<void> {
  const text = await fs.readFile('package.json', 'utf8');
  const json = JSON.parse(text);
  const indent = text.match(/^\s+/mu)?.[0] || '  ';

  await fs.writeFile('package.json', JSON.stringify({ ...json, version }, null, indent) + '\n');
}

async function writeChangelog(version: string, logs: readonly Log[]): Promise<void> {
  const text = await fs.readFile('CHANGELOG.md', 'utf8').catch((error: unknown) => {
    if ((error as any)?.code === 'ENOENT') return '';
    throw error;
  });
  const [, header, rest = ''] = text.match(/^(# \S.*?(?=\n#|$))(.*)$/su) ?? [];
  const date = new Date();
  const year = String(date.getFullYear()).padStart(4, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const changeLogMessage = [
    `## ${version} - ${year}-${month}-${day}\n`,
    ...logs.map(({ message, hash }) => `- ${message} (\`${hash}\`)`),
  ].join('\n');

  await fs.writeFile('CHANGELOG.md', [
    header?.trim() || '# Changelog',
    changeLogMessage,
    rest.trim(),
  ].filter(Boolean).join('\n\n') + '\n');
}
