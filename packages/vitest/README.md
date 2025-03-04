# @seahax/vitest

Vitest config helpers.

## Test Config

- Pass with no tests.
- Pin the timezone to UTC.
- Restores all mocks _after_ each test (not before).
- Enables real timers _after_ each test (not before).

File: vitest.config.ts

```ts
import { testDefaults } from '@seahax/vitest';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    ...testDefaults,
  }
});
```

## Workspace Config

- Automatically detect workspace directory globs from `pnpm-workspace.yaml` or `package.json` (optional).
- Find all `vitest.config.*` files in workspace directories.

File: vitest.workspace.ts

```ts
import { defineWorkspace } from '@seahax/vitest';

export default defineWorkspace();
```

Workspace directory globs can also be provided manually.

```ts
export default defineWorkspace(['packages/*']);
```
