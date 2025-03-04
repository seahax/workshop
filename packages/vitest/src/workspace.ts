import fs from 'node:fs';
import path from 'node:path';

import callsites from 'callsites';
import { globSync } from 'glob';
import YAML from 'yaml';

/**
 * Smart Vitest workspace definition.
 *
 * - Automatically detect workspace directory globs from `pnpm-workspace.yaml`
 *   or `package.json` (optional).
 * - Find all `vitest.config.*` files in workspace directories.
 */
export function defineWorkspace(workspaceGlobs?: readonly string[]): string[] {
  const dir = path.dirname(callsites()[1]!.getFileName()!);

  if (workspaceGlobs == null) {
    workspaceGlobs = getPnpmGlobs(dir) ?? getPackageGlobs(dir);

    if (!workspaceGlobs) {
      throw new Error('Unable to automatically determine workspace globs.');
    }
  }

  const configs = globSync([...workspaceGlobs], { nodir: false, withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((entry) => globSync('vitest.config.*', { cwd: entry.fullpath(), absolute: true }));

  console.log('Detected Vitest Configs:');
  configs.forEach((config) => console.log('- ' + path.relative(dir, config)));

  return configs;
}

function getPnpmGlobs(dir: string): readonly string[] | undefined {
  try {
    const yaml = fs.readFileSync(`${dir}/pnpm-workspace.yaml`, 'utf8');
    const data = YAML.parse(yaml);

    if (Array.isArray(data?.packages)) {
      return data.packages;
    }
  }
  catch {
    // ignore
  }
}

function getPackageGlobs(dir: string): readonly string[] | undefined {
  try {
    const json = fs.readFileSync(`${dir}/package.json`, 'utf8');
    const data = JSON.parse(json);

    if (Array.isArray(data?.workspaces)) {
      return data.workspaces;
    }
  }
  catch {
    // ignore
  }
}
