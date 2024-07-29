# @seahax/vite-plugin-finalize

Run a task after the bundle is written.

- Only runs on build (not serve).
- The `$` utility passed to the callback is a pre-configured `execa` instance with the working directory set to the project root.

```ts
import { defineConfig } from 'vite';
import finalize from '@seahax/vite-plugin-finalize'

export default defineConfig({
  plugins: [
    finalize(async ($, config, bundle) => {
      // Example: Run TypeScript to check types and/or generate declarations.
      await $`tsc -b`;
    }),
  ],
});
```

The `finalize` plugin can also be used with a template string to run a command, just like the `execa` function.

```ts
finalize`tsc -b`;
// With execa options.
finalize({ cwd: './relative/to/vite/config/root' })`tsc -b`;
```
