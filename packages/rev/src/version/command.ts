#!/usr/bin/env node
import fs from 'node:fs/promises';

import { alias, createHelp, cue, flag, option, parseOptions } from '@seahax/args';
import { getPackages } from '@seahax/monorepo';

import { printResult } from './print-result.ts';
import { type Result, update } from './update.ts';

const help = createHelp`
{bold Usage:} rev version {blue [options]}

Bump package versions and update changelogs based on conventional(-ish) commit
history. The type of version bump (patch, minor, or major) is based loosely on
the Conventional Commits spec. 

Read the docs for more information on commit message formating:
https://github.com/seahax/workshop/blob/main/packages/rev/README.md#version

{bold Options:}
  {blue --force}             Bump the version even if there are no new commits.
  {blue --allow-dirty}       Allow the Git working directory to be dirty.
  {blue --release-file}      Release manifest file (default: .release.json).
  {blue --no-release-file}   Do not write a release manifest file.
  {blue --dry-run}           Do not write any files.
  {blue --help, -h}          Show this help message.
`;

export async function versionCommand(args: string[]): Promise<void> {
  const options = await parseOptions(args, {
    '--force': flag(),
    '--allow-dirty': flag(),
    '--release-file': option(),
    '--no-release-file': flag(),
    '--dry-run': flag(),
    '--help': cue(),
    '-h': alias('--help'),
  });

  if (options.value === '--help') {
    help();
    process.exit();
  }

  if (options.issues) {
    help.toStderr`{red ${options.issues[0]}}`;
    process.exit(1);
  }

  const {
    '--force': force,
    '--allow-dirty': allowDirty,
    '--release-file': releaseFile = '.release.json',
    '--no-release-file': noReleaseFile,
    '--dry-run': dryRun,
  } = options.value;
  const packages = await getPackages(process.cwd());
  const results = new Map<string, Result>();

  for (const pkg of packages) {
    const result = await update({ pkg, force, allowDirty });
    results.set(pkg.data.name, result);
    printResult(result);
  }

  if (dryRun) return;

  const released: string[] = [];

  await Promise.all(Array.from(results.values()).map(async (result) => {
    if (!('commit' in result)) return;

    await result.commit();
    released.push(`${result.name}@${result.versions.to}`);
  }));

  if (!noReleaseFile) {
    await fs.writeFile(releaseFile, JSON.stringify({
      date: new Date().toISOString(),
      released,
    }, null, 2), 'utf8');
  }
}
