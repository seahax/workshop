import external from '@seahax/vite-plugin-external';
import { $ } from 'execa';
import { defineConfig } from 'vite';

process.chdir(import.meta.dirname);

export default defineConfig({
  plugins: [
    external(),
    {
      name: 'finalize',
      async writeBundle() {
        await $`tsc -b --force`;
      },
    },
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
