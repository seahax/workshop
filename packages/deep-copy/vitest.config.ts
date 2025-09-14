import { testDefaults } from '@seahax/vitest';
import { defineProject } from 'vitest/config';

export default defineProject({
  test: {
    ...testDefaults,
  },
});
