import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    passWithNoTests: true,
    setupFiles: ['vitest.setup.ts'],
    coverage: {
      reporter: ['text', 'html', 'lcovonly'],
      provider: 'v8',
      include: ['packages/*/src/**/*'],
      exclude: ['**/index.ts', '**/types/**/*', '**/constants/**/*'],
    },
  },
});
