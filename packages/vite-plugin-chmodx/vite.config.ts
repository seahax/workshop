import external from '@seahax/vite-plugin-external';
import finalize from '@seahax/vite-plugin-finalize';
import { defineConfig } from 'vite';

process.chdir(import.meta.dirname);

export default defineConfig({
  plugins: [
    external(),
    finalize`tsc -b src/tsconfig.json --force`,
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
        entryFileNames: '[name].mjs',
      },
    },
  },
  resolve: {
    conditions: ['node'],
  },
});
