import lib from '@seahax/vite-plugin-lib';
import zip from '@seahax/vite-plugin-zip';
import { defineConfig } from 'vite';

process.chdir(import.meta.dirname);

export default defineConfig({
  plugins: [
    lib({ bundle: true, forceFormatExtensions: true }),
    zip(),
  ],
  build: {
    target: ['node20'],
  },
});
