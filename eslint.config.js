import seahax from '@seahax/eslint';

export default [
  {
    ignores: ['**/{node_modules,lib,dist,out,coverage}'],
  },
  ...seahax,
];
