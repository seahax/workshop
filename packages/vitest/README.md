# @seahax/vitest

Vitest config helpers.

## Test Config

- Pass with no tests.
- Pin the timezone to UTC.
- Restores all mocks _after_ each test (not before).
- Enables real timers _after_ each test (not before).

File: `vitest.config.ts`

```ts
import { testDefaults } from '@seahax/vitest';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    ...testDefaults,
    // Additional test options...
  }
});
```

## Workspace Config

- Automatically detect workspace directory globs from `pnpm-workspace.yaml` or `package.json` (optional).
- Find all `vitest.config.*` files in workspace directories.

Vitest doesn't normally require a `vitest.config.*` file to be present in each workspace directory. This utility enforces the config file requirement so that: a) testing a package can be disabled by omitting the config file, or b) multiple test configurations can be defined for a single package by creating multiple config files.

File: `vitest.workspace.ts`

```ts
import { defineWorkspace } from '@seahax/vitest';

export default defineWorkspace();
```

Workspace directory globs can also be provided manually.

```ts
export default defineWorkspace(['packages/*']);
```
