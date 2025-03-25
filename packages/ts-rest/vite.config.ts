import lib from '@seahax/vite-plugin-lib';
import { defineConfig } from 'vite';

process.chdir(import.meta.dirname);

export default defineConfig({
  plugins: [
    lib({ entry: ['src/router.ts', 'src/express.ts'] }),
  ],
});
