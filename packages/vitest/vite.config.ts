import lib from '@seahax/vite-plugin-lib';
import { defineConfig } from 'vite';

process.chdir(import.meta.dirname);

export default defineConfig({
  plugins: [
    lib({
      target: 'node',
      entry: ['src/index.ts', 'src/config.global-setup.ts', 'src/config.setup.ts'],
    }),
  ],
});
