/* eslint-disable import/no-extraneous-dependencies */
import fs from 'node:fs';

import { globSync } from 'glob';
import YAML from 'yaml';

const { packages } = YAML.parse(fs.readFileSync(`${import.meta.dirname}/pnpm-workspace.yaml`, 'utf8'));

export default globSync(packages, { nodir: false, withFileTypes: true })
  .filter((path) => path.isDirectory())
  .map((path) => `${path.parentPath}/${path.name}`)
  .filter((path) => {
    const files = fs.readdirSync(path, { withFileTypes: true, recursive: true })
      .filter((dirent) => dirent.isFile())
      .map((dirent) => `${dirent.parentPath}/${dirent.name}`);

    return (
      files.some((file) => /\bvitest\.config(?:\..*)?\.ts$/.test(file))
      && files.some((file) => file.endsWith('.spec.ts'))
    );
  });
