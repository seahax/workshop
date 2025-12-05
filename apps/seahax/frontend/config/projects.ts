import type { Dirent } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';

import { $ } from 'execa';

import type { Project } from '../src/services/projects.ts';

/**
 * Manually defined packages.
 */
const PROJECTS = [
  //
] as const satisfies Project[];

async function findPackages(dir: string): Promise<Project[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const directories: Dirent[] = [];
  const promises = entries.map(async (entry): Promise<Project[]> => {
    if (entry.isDirectory() && entry.name !== 'node_modules') {
      directories.push(entry);
      return findPackages(path.join(dir, entry.name));
    }

    if (entry.name === 'go.mod') {
      const [modText, summaryText] = await Promise.all([
        fs.readFile(path.join(dir, entry.name), 'utf8').catch(() => ''),
        fs.readFile(path.join(dir, 'go.summary'), 'utf8').catch(() => ''),
      ]);

      const summary = summaryText.replaceAll(/\s+/gu, ' ').trim();

      if (!summary) return [];

      const moduleMatch = /^module\s+(\S+)\s*$/mu.exec(modText);

      if (!moduleMatch) return [];

      const moduleName = moduleMatch[1]!;
      const name = moduleName.replace(/^.*?\//u, '');

      return [{
        type: 'go',
        name,
        shortName: name.replace(/^.*\//u, ''),
        description: summary,
        homepage: `https://pkg.go.dev/${moduleName}`,
      }];
    }

    if (entry.name === 'package.json') {
      const text = await fs.readFile(path.join(dir, entry.name), 'utf8');
      const json = JSON.parse(text);

      if (!json.name) return [];
      if (!json.description) return [];
      if (json.private) return [];

      return [
        {
          type: 'npm',
          name: json.name,
          shortName: json.name.replace(/^.*\//u, ''),
          description: json.description,
          homepage: json.homepage ?? `https://www.npmjs.com/package/${json.name}`,
        },
      ];
    }

    return [];
  });

  const projectArrays = await Promise.all(promises);
  const projects = projectArrays.flat();

  return projects;
}

const { stdout: projectRoot } = await $`git rev-parse --show-toplevel`;
const localPackages = await findPackages(projectRoot);
const packages = [...localPackages, ...PROJECTS].sort((a, b) => a.shortName.localeCompare(b.shortName));

export default packages;
