#!/usr/bin/env node
/* eslint-disable import/no-extraneous-dependencies */
import { readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { $ } from 'execa';

void (async () => {
  const newName = process.argv[2];

  if (!newName || !/^(?:@[a-z0-9-][._a-z0-9]*\/)?[a-z0-9-][._a-z0-9-]*$/u.test(newName)) {
    console.error('invalid name');
    process.exit(1);
  }

  const packageJson = await readFile('package.json', 'utf8').then(JSON.parse);
  const tsConfigBuild = await readFile('tsconfig.build.json', 'utf8').then(JSON.parse);
  const readmeText = await readFile('README.md', 'utf8');
  const { stdout: directory } = await $`git rev-parse --show-prefix`;

  packageJson.name = `@seahax/${newName}`;
  packageJson.repository.directory = `${path.dirname(directory)}/${newName}`;
  delete packageJson?.scripts?.rename;

  tsConfigBuild.extends = `${path.posix.relative(`/${packageJson.repository.directory}`, '/')}/tsconfig.base.json`;

  await writeFile('package.json', JSON.stringify(packageJson, null, 2) + '\n');
  await writeFile('tsconfig.build.json', JSON.stringify(tsConfigBuild, null, 2) + '\n');
  await writeFile('README.md', readmeText.replaceAll(/^.*/gu, `# ${packageJson.name}`));
  await rm(import.meta.filename, { force: true });
  await rename(import.meta.dirname, `../${newName}`);
})();
