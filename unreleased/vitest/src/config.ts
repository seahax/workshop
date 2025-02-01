import path from 'node:path';

import { type ViteUserConfig } from 'vitest/config';

export const testDefaults = {
  passWithNoTests: true,
  globalSetup: [path.resolve(import.meta.dirname, 'config.global-setup.mjs')],
  setupFiles: [path.resolve(import.meta.dirname, 'config.setup.mjs')],
} as const satisfies ViteUserConfig['test'];
