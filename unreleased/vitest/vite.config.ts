import finalize from '@seahax/vite-plugin-finalize';
import lib from '@seahax/vite-plugin-lib';
import { defineConfig } from 'vite';

process.chdir(import.meta.dirname);

export default defineConfig({
  plugins: [
    lib(),
    finalize`tsc -b src/tsconfig.json --force`,
  ],
  build: {
    lib: {
      entry: ['src/config.ts', 'src/config.global-setup.ts', 'src/config.setup.ts'],
    },
  },
});
