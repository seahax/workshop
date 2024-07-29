import { chmod, stat } from 'node:fs/promises';
import path from 'node:path';

import { type Plugin } from 'vite';

export default function chmodx(): Plugin {
  return {
    name: 'chmodx',
    async writeBundle({ dir }, bundle) {
      await Promise.all(Object.entries(bundle).map(async ([filename, chunk]) => {
        if (!('code' in chunk) || !chunk.code.startsWith('#!')) return;
        const absFilename = path.resolve(dir!, filename);
        await chmod(absFilename, await stat(absFilename).then((stats) => stats.mode) | 0o111);
        this.info(filename);
      }));
    },
  };
}
