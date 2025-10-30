import { testDefaults } from '@seahax/vitest';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    ...testDefaults,
    coverage: {
      enabled: true,
      reporter: ['text', 'html', 'lcovonly'],
      provider: 'v8',
      include: ['packages/*/src/**/*.(ts|tsx|js|jsx)'],
      exclude: ['**.d.ts', '**/index.*', '**/types/**/*', '**/constants/**/*'],
    },
    projects: [
      'packages/*/vitest.config.ts',
      'apps/*/*/vitest.config.ts',
    ],
  },
});
