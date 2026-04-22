import lib from '@seahax/vite-plugin-lib';
import { testDefaults } from '@seahax/vitest';
import { defineConfig } from 'vitest/config';

process.chdir(import.meta.dirname);

export default defineConfig({
  plugins: [lib({ bundle: true })],
  test: { ...testDefaults },
});
