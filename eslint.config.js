import seahax from '@seahax/eslint';

export default seahax({
  ignores: ['**/{.*,node_modules,lib,dist,out,coverage}'],
  tsconfigPath: './tsconfig.eslint.json',
});
