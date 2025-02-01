/* eslint-disable import/no-extraneous-dependencies */
import fs from 'node:fs';

import { globSync } from 'glob';
import YAML from 'yaml';

const { packages } = YAML.parse(fs.readFileSync(`${import.meta.dirname}/pnpm-workspace.yaml`, 'utf8'));

export default globSync(packages, { nodir: false, withFileTypes: true })
  .filter((path) => path.isDirectory())
  .flatMap((path) => globSync('vitest.config.*', { cwd: path.fullpath(), absolute: true }));
