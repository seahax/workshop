import { testDefaults } from '@seahax/vitest';
import { analyzer, unstableRolldownAdapter } from 'vite-bundle-analyzer';
import { defineConfig } from 'vitest/config';

process.chdir(import.meta.dirname);

export default defineConfig({
  plugins: [
    unstableRolldownAdapter(
      analyzer({
        analyzerMode: 'static',
        fileName: `${import.meta.dirname}/out/stats-demo.html`,
        defaultSizes: 'gzip',
      }),
    ),
  ],
  build: {
    target: 'es2023',
    outDir: 'out/demo',
  },
  test: { ...testDefaults },
});
