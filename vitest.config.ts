import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    passWithNoTests: true,
    globalSetup: ['vitest.global-setup.ts'],
    setupFiles: ['vitest.setup.ts'],
    coverage: {
      enabled: true,
      reporter: ['text', 'html', 'lcovonly'],
      provider: 'v8',
      include: ['packages/*/src/**/*', 'apps/*/*/src/**/*'],
      exclude: ['**/index.ts?(x)', '**/types/**/*', '**/constants/**/*'],
    },
  },
});
