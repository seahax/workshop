#!/usr/bin/env node
import fs from 'node:fs/promises';

import { main } from '@seahax/main';
import { $ } from 'execa';
import semver from 'semver';

main(async () => {
  const {
    name,
    version,
    private: isPrivate = false,
  } = await fs.readFile('package.json', 'utf8').then((value) => JSON.parse(value));

  if (isPrivate) return;

  const view = await $({ stdio: 'pipe', reject: false })`npm view ${`${name}@<=${version}`} name version gitHead --json`
    .then(({ stdout, stderr, stdio, exitCode }) => {
      if (exitCode !== 0) {
        if (stderr.includes('E404')) return;
        console.error(stdio);
        process.exitCode = exitCode;
        throw new Error('NPM view failed.');
      }

      const results = JSON.parse(stdout);
      const result = Array.isArray(results)
        ? results.sort((a, b) => semver.compare(b.version, a.version)).at(0)
        : results;

      return result;
    });

  if (!view) {
    console.log('The package is not published with the current or an earlier version.');
    return;
  }

  await $({ stdio: 'inherit' })`git log ${'--pretty=format:%C(yellow)%h%C(reset) %s'} ${view.gitHead}..HEAD -- .`;
});
