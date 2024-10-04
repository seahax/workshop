import { expect, test, vi } from 'vitest';

import { createChangelogEntry } from './create-changelog-entry.js';

test('createChangeLogEntry', () => {
  vi.useFakeTimers();
  vi.setSystemTime(1728013109037);

  const entry = createChangelogEntry('1.2.3', [
    { type: 'fix', description: 'fix 1', breaking: false, scope: 'scope1' },
    { type: 'fix', description: 'fix 2', breaking: false },
    { type: 'feat', description: 'feat 1', breaking: true, scope: 'scope2' },
    { type: 'feat', description: 'feat 1', breaking: true },
  ]);

  expect(entry.version).toBe('1.2.3');
  expect(entry.content).toMatchInlineSnapshot(`
    "## 1.2.3 - 2024-10-03

    ### Features

    - *(scope2)* **[breaking]** feat 1
    - **[breaking]** feat 1

    ### Fixes

    - *(scope1)* fix 1
    - fix 2"
  `);
});
