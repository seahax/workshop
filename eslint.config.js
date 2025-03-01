import seahax from '@seahax/eslint';
import functional from 'eslint-plugin-functional';

export default [
  seahax(),
  {
    plugins: { functional },
    rules: {
      'functional/no-classes': ['warn', { ignoreIdentifierPattern: 'Error$' }],
    },
  },
].flat();
