import { defineConfig } from 'vite';

import preview from '../dist/index.js';

process.chdir(import.meta.dirname);

export default defineConfig({
  plugins: [preview()],
  build: {
    target: ['es2022'],
    outDir: 'dist',
    sourcemap: true,
  },
});
