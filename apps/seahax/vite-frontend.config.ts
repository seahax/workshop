import { defineConfig } from 'vite';

process.chdir(import.meta.dirname);

export default defineConfig({
  build: {
    emptyOutDir: true,
    sourcemap: true,
    target: 'es2023',
    outDir: 'dist/frontend',
  },
});
