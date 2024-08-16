#!/usr/bin/env node
import fs from 'node:fs/promises';

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

  const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'));

  if (!packageJson || typeof packageJson !== 'object') return;
  if (!packageJson.name || typeof packageJson.name !== 'string') return;
  if (packageJson.private) return;

  const npmResult = await $({ all: true })`npm view ${packageJson.name} --json gitHead`;

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

  const gitHead = JSON.parse(npmResult.stdout);
  const gitResult = await $({ all: true })`git diff --name-only ${gitHead}`;

  if (gitResult.exitCode !== 0) {
    process.stderr.write(gitResult.all);
    process.exitCode = gitResult.exitCode;
    return;
  }

  if (gitResult.stdout.trim() !== '') {
    console.log(packageJson.name);
  }
})().catch((error: unknown) => {
  console.error(String(error));
  process.exit(1);
});
