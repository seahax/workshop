import fs from 'node:fs/promises';
import path from 'node:path';

export async function getVersion(): Promise<string> {
  let dir = import.meta.dirname;
  const root = path.parse(dir).root;

  do {
    try {
      const text = await fs.readFile(path.join(dir, 'package.json'), 'utf8');
      const data = JSON.parse(text);
      return data.version;
    }
    catch {
      // Ignore errors.
    }

    dir = path.dirname(dir);
  } while (dir !== root);

  return '0.0.0';
}
