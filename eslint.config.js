import path from 'node:path';

import seahax from '@seahax/eslint';
import wrap from '@seahax/eslint-plugin-wrap';

/** @type {import('eslint').Linter.Config[]} */
export default [
  seahax({
    ignores: ['**/{.*,node_modules,lib,dist,out,coverage}'],
    tsconfigPath: path.resolve(import.meta.dirname, './tsconfig.eslint.json'),
  }),
  wrap.config({
    maxLen: 120,
    tabWidth: 2,
  }),
].flat();
