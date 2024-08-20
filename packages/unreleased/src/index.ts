#!/usr/bin/env node
import fs from 'node:fs/promises';

import chalk from 'chalk';
import { $ } from 'execa';

interface Options {
  readonly help?: boolean;
}

(async () => {
  const options = process.argv.slice(2).reduce<Options>((acc, arg) => {
    switch (arg) {
      case '--help':
      case '-h': {
        return { ...acc, help: true };
      }
    }

    throw new Error(`unknown option "${arg}"`);
  }, {});

  if (options.help) {
    console.log(`Usage: unreleased

Print the package name if there are unpublished changes. No-op if all changes
have been published, or if the package is private.

Options:
  -h, --help  Display this help message   
`);
    return;
  }

  const packageJson = await getPackageJson();

  if (packageJson === undefined) {
    throw new Error('package.json not found');
  }

  if (typeof packageJson?.name !== 'string') return;
  if (packageJson?.private) return;

  const npmResult = await $({ all: true, reject: false })`npm view ${packageJson.name} --json gitHead`;

  if (npmResult.exitCode !== 0) {
    try {
      const data = JSON.parse(npmResult.stdout);

      if (data?.error?.code === 'E404') {
        console.log(packageJson.name);
        return;
      }
    }
    catch {
      // ignore
    }

    process.stderr.write(npmResult.all);
    process.exitCode = npmResult.exitCode;
    return;
  }

  const gitHead: string = JSON.parse(npmResult.stdout);
  const gitResult = await $({ all: true, reject: false })`git log ${'--pretty=format:  %h  %s'} ${gitHead}..HEAD -- .`;

  if (gitResult.exitCode !== 0) {
    process.stderr.write(gitResult.all);
    process.exitCode = gitResult.exitCode;
    return;
  }

  if (gitResult.stdout.trim() !== '') {
    console.log(`${chalk.bold(packageJson.name)} ${chalk.blue.dim(`(${gitHead.slice(0, 8)})`)}`);
    console.log(gitResult.stdout.trimEnd().replaceAll(/^ {2}(\S+) {2}(.*)$/gmu, (_, hash, message) => `  ${chalk.blue(hash)}  ${message}`));
  }
})().catch((error: unknown) => {
  console.error(String(error));
  process.exit(1);
});

async function getPackageJson(): Promise<any> {
  try {
    return JSON.parse(await fs.readFile('package.json', 'utf8'));
  }
  catch (error: any) {
    if (error?.code !== 'ENOENT') {
      throw error;
    }
  }

  const cwd = process.cwd();

  process.chdir('..');

  if (process.cwd() === cwd) return;

  return getPackageJson();
}
