import { defineWorkspace } from '@seahax/vitest';

export default defineWorkspace([
  'packages/*',
  'unreleased/*',
  'apps/*/*',
]);
