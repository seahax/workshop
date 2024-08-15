import fs from 'node:fs/promises';
import { isBuiltin } from 'node:module';
import path from 'node:path';

import { type Plugin, type Rollup } from 'vite';

export interface ExternalOptions {
  packageJsonPath?: string;
}

export default function external({ packageJsonPath = 'package.json' }: ExternalOptions = {}): Plugin {
  return {
    name: 'external',
    async configResolved(config) {
      const external = getExternalCallback(config.build.rollupOptions.external);
      const packageJson = await fs.readFile(path.resolve(config.root, packageJsonPath), 'utf8').then(JSON.parse);
      const prodDepNames = Object.keys({
        ...packageJson.dependencies,
        ...packageJson.peerDependencies,
        ...packageJson.optionalDependencies,
      });

      config.build.rollupOptions.external = (id, importer, isResolved) => {
        if (external(id, importer, isResolved)) return true;
        if (id.startsWith('node:')) return true;
        if (isBuiltin(id)) return true;
        if (prodDepNames.includes(id)) return true;

        return false;
      };
    },
  };
}

function getExternalCallback(
  external: Rollup.ExternalOption | undefined,
): (source: string, importer: string | undefined, isResolved: boolean) => boolean | Rollup.NullValue {
  if (typeof external === 'function') return external;
  if (typeof external === 'string') return (id) => id === external;
  if (external instanceof RegExp) return (id) => external.test(id);
  if (Array.isArray(external)) {
    return (id) => external.some((value) => {
      if (typeof value === 'string' && id === value) return true;
      if (value instanceof RegExp && value.test(id)) return true;
      return false;
    });
  }

  return () => false;
}
