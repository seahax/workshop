import path from 'node:path';

import seahax from '@seahax/eslint';

/** @type {import('eslint').Linter.Config[]} */
export default [
  seahax({
    ignores: ['**/{.*,node_modules,lib,dist,out,coverage}'],
    tsconfigPath: path.resolve(import.meta.dirname, './tsconfig.eslint.json'),
  }),
].flat();
