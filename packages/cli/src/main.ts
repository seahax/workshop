import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Command } from './command.ts';

export interface MainOptions {
  /**
   * Array of argument strings.
   *
   * @default process.argv.slice(2)
   */
  readonly args?: readonly string[];
}

export async function main(
  meta: Partial<Pick<ImportMeta, 'filename' | 'main'>> | NodeJS.Module,
  command: Command,
  { args = process.argv.slice(2) }: MainOptions = {},
): Promise<void> {
  if (isMain(meta)) {
    return command([...args]);
  }
}

export function isMain(meta: Partial<Pick<ImportMeta, 'filename' | 'main'>> | NodeJS.Module): boolean {
  if ('main' in meta && typeof meta.main === 'boolean') return meta.main;
  if (typeof require !== 'undefined' && require.main === meta) return true;
  if (!('url' in meta) || typeof meta.url !== 'string') return false;

  const filename = fileURLToPath(meta.url);
  const ext = path.extname(filename);

  return filename === (ext ? process.argv[1] : process.argv[1]! + path.extname(filename));
}
