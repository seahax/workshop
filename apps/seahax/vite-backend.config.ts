import lib from '@seahax/vite-plugin-lib';
import { defineConfig } from 'vite';

process.chdir(import.meta.dirname);

export default defineConfig({
  plugins: [
    lib({ entry: 'src/backend/index.ts', target: 'node', bundle: true }),
  ],
  build: {
    emptyOutDir: true,
    outDir: 'dist/backend',
  },
});
