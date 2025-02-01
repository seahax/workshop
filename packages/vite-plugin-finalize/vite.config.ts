import external from '@seahax/vite-plugin-external';
import { defineConfig } from 'vite';

process.chdir(import.meta.dirname);

export default defineConfig({
  plugins: [
    external(),
  ],
  build: {
    target: ['es2022'],
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
    },
    sourcemap: true,
    rollupOptions: {
      output: {
        preserveModules: true,
        entryFileNames: '[name].js',
      },
    },
  },
  resolve: {
    conditions: ['node'],
  },
});
