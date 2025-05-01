import * as fs from 'node:fs/promises';

import { globby } from 'globby';

export async function getDirectories(): Promise<string[]> {
  return await getConfigDirectories() ?? [process.cwd()];
}

async function getConfigDirectories(): Promise<string[] | undefined> {
  try {
    const text = await fs.readFile('.rev', 'utf8');
    const lines = text.split(/\r?\n/u).filter((line) => !/^(?:#|\s*$)/u.test(line)).map((line) => line.trim());
    const dirs = await globby(lines, { absolute: true, onlyDirectories: true, dot: true });

    dirs.sort();

    return dirs;
  }
  catch {
    return undefined;
  }
}
