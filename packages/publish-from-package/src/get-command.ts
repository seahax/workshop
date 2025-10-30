import fs from 'node:fs/promises';
import path from 'node:path';

export async function getCommand(dir: string): Promise<string | undefined> {
  dir = path.resolve(dir);

  if (await exists(path.join(dir, 'pnpm-lock.yaml'))) return 'pnpm publish --no-git-checks';
  if (await exists(path.join(dir, 'yarn.lock'))) return 'yarn npm publish';
  if (await exists(path.join(dir, 'package-lock.json'))) return 'npm publish';

  const parent = path.dirname(dir);

  if (parent === dir) {
    return undefined;
  }

  return getCommand(parent);
}

async function exists(file: string): Promise<boolean> {
  try {
    await fs.access(file);
    return true;
  }
  catch {
    return false;
  }
}
