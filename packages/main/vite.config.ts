import lib from '@seahax/vite-plugin-lib';
import { defineConfig } from 'vite';

process.chdir(import.meta.dirname);

export default defineConfig({
  plugins: [
    lib({ runtime: 'node', entry: ['src/index.ts', 'src/errors.ts'] }),
  ],
});
