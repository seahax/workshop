import base from 'config-eslint';
import { defineConfig } from 'eslint/config';

export default defineConfig(
  base(),
  {
    rules: {
      'react/require-render-return': 'off',
    },
  },
);
