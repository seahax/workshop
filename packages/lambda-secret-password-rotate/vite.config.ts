import lib from '@seahax/vite-plugin-lib';
import zip from '@seahax/vite-plugin-zip';
import { defineConfig } from 'vite';

process.chdir(import.meta.dirname);

export default defineConfig({
  plugins: [
    lib({ bundle: true }),
    zip({ extraFiles: { 'package.json': '{ "type": "module" }' } }),
  ],
  build: {
    target: ['node20'],
  },
});
