import { expect, test, vi } from 'vitest';

import { createChange } from './create-change.js';

test('createChange', () => {
  vi.useFakeTimers();
  vi.setSystemTime(1728013109037);

  const entry = createChange('1.2.3', [
    { type: 'fix', description: 'fix 1', isBreaking: false, scope: 'scope1' },
    { type: 'fix', description: 'fix 2', isBreaking: false, scope: undefined },
    { type: 'feat', description: 'feat 1', isBreaking: true, scope: 'scope2' },
    { type: 'feat', description: 'feat 1', isBreaking: true, scope: undefined },
  ], 'note');

  expect(entry.version).toBe('1.2.3');
  expect(entry.content).toMatchInlineSnapshot(`
    "## 1.2.3 (2024-10-04)

    note

    ### Features

    - *(scope2)* **[breaking]** feat 1
    - **[breaking]** feat 1

    ### Fixes

    - *(scope1)* fix 1
    - fix 2"
  `);
});
