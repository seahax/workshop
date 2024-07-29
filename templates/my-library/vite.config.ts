import { readFile } from 'node:fs/promises';
import { isBuiltin } from 'node:module';

import chmodx from '@seahax/vite-plugin-chmodx';
import { defineConfig } from 'vite';

process.chdir(import.meta.dirname);

const packageJson = await readFile('./package.json', 'utf8').then(JSON.parse);
const prodDepNames = Object.keys({
  ...packageJson.dependencies,
  ...packageJson.peerDependencies,
  ...packageJson.optionalDependencies,
});

export default defineConfig({
  plugins: [
    chmodx(),
  ],
  build: {
    target: ['es2022'],
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
    },
    sourcemap: true,
    rollupOptions: {
      external: (id) => prodDepNames.includes(id) || isBuiltin(id) || id.startsWith('node:'),
      output: {
        preserveModules: true,
        entryFileNames: '[name].js',
      },
    },
  },
  // resolve: {
  //   conditions: ['node'],
  // },
});
