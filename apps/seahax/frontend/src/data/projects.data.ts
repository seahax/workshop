import type { Dirent } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';

import { $ } from 'execa';

export interface Project {
  name: string;
  description: string;
  homepage: string;
}

/**
 * Manually defined packages.
 */
const PROJECTS = [
  //
] as const as Project[];

// TODO: Add Go projects.

async function findPackages(dir: string): Promise<Project[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const directories: Dirent[] = [];
  const promises = entries.map(async (entry): Promise<Project[]> => {
    if (entry.isDirectory() && entry.name !== 'node_modules') {
      directories.push(entry);
      return findPackages(path.join(dir, entry.name));
    }

    if (entry.name !== 'package.json') return [];

    const text = await fs.readFile(path.join(dir, entry.name), 'utf8');
    const json = JSON.parse(text);

    if (!json.name) return [];
    if (!json.description) return [];
    if (json.private) return [];

    return [
      {
        name: json.name,
        description: json.description,
        homepage: json.homepage ?? `https://www.npmjs.com/package/${json.name}`,
      },
    ];
  });
  const packageArrays = await Promise.all(promises);
  const packages = packageArrays.flat().sort((a, b) => a.name.localeCompare(b.name));

  return packages;
}

const { stdout: projectRoot } = await $`git rev-parse --show-toplevel`;
const localPackages = await findPackages(projectRoot);
const packages = [...localPackages, ...PROJECTS].sort((a, b) => a.name.localeCompare(b.name));

export default packages;
