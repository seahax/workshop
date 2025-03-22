import { defineConfig } from 'vite';

process.chdir(import.meta.dirname);

export default defineConfig({
  build: {
    emptyOutDir: true,
    outDir: '../../dist/frontend',
  },
});
