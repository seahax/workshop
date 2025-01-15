import finalize from '@seahax/vite-plugin-finalize';
import lib from '@seahax/vite-plugin-lib';
import { defineConfig } from 'vite';

process.chdir(import.meta.dirname);

export default defineConfig({
  plugins: [
    lib(),
    finalize`tsc -b --force`,
  ],
  build: {
    target: ['node20'],
    lib: { entry: 'src/bin.ts' },
  },
});
