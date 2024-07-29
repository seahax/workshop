declare global {
  import type { Linter } from 'eslint';
  type ESLintConfig = Linter.Config;
  type ESLintConfigs = ESLintConfig[];
}

declare module 'eslint-plugin-react' {
  import type { ESLint } from '@eslint/js';
  const value: {
    configs: {
      flat: {
        recommended: ESLint.Config;
        'jsx-runtime': ESLint.Config;
      };
    };
  };
  export default value;
}
