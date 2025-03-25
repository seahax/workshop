import { defineConfig } from 'vite';

process.chdir(import.meta.dirname);

export default defineConfig({
  build: {
    target: 'es2023',
    sourcemap: true,
  },
});
