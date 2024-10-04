import { afterEach, vitest } from 'vitest';

afterEach(() => {
  vitest.restoreAllMocks();
  vitest.useRealTimers();
});
