#!/usr/bin/env node
const { readFile, rename, rm, writeFile } = require('node:fs/promises');

void (async () => {
  const newName = process.argv[2];

  if (!newName || !/^(?:@[a-z0-9-][._a-z0-9]*\/)?[a-z0-9-][._a-z0-9-]*$/u.test(newName)) {
    console.error('invalid name');
    process.exit(1);
  }

  const packageJson = await readFile('package.json', 'utf8').then(JSON.parse);
  const readmeText = await readFile('README.md', 'utf8');

  packageJson.name = `@seahax/${newName}`;
  delete packageJson?.scripts?.rename;

  await writeFile('package.json', JSON.stringify(packageJson, null, 2) + '\n');
  await writeFile('README.md', readmeText.replaceAll(/\bmy-library\b/gu, newName));
  await rm(__filename, { force: true });
  await rename(__dirname, `../${newName}`);
})();
