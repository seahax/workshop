import semver from 'semver';

import { type NpmView } from '../types/npm-view.js';
import { exec } from './exec.js';

export async function execNpmView(name: string, currentVersion: string): Promise<NpmView | null> {
  const { exitCode, stdout, stderr } = await exec({ reject: false })`npm view ${`${name}@<=${currentVersion}`} name version gitHead --json`;

  if (exitCode && stderr.includes('E404')) {
    return null;
  }

  const entries: {
    name: string;
    version: string;
    gitHead?: string;
  }[] = JSON.parse(stdout);

  const closest = entries.sort((a, b) => semver.compare(b.version, a.version)).at(0);

  if (!closest) {
    return null;
  }

  return {
    version: closest.version,
    gitHead: closest.gitHead,
  };
}
