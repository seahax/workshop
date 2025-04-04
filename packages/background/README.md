# @seahax/background

Run an async task without waiting for it to return, the responsible way.

## Getting Started

Create a new `background` function, configured to handle failures.

```ts
import { createBackground } from '@seahax/background';

const background = createBackground((error) => {
  // Example: Use Sentry to capture errors.
  Sentry.captureException(error);
});
```

Then run tasks in the background.

```ts
background(async () => {
  await doSomeWork();
});
```

You can also pass options to the error handler.

```ts
const background = createBackground((error, options: { task: string }) => {
  // Example: Use Sentry to capture errors, with extra data.
  Sentry.captureException(error, {
    tags: { background_task: task }
  });
});
```

Then, the returned `background` function will accept an extra options argument.

```ts
background(async () => {
  await doSomeWork();
}, {
  task: 'doSomeWork'
});
```
