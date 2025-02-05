import { defineConfig } from 'vite';

import lib from './src/index.ts';

process.chdir(import.meta.dirname);

export default defineConfig({
  plugins: [
    // Uses itself to build itself.
    lib({ target: 'node' }),
  ],
});
