# @seahax/semaphore

Asynchronous semaphore.

## Getting Started

Declare a semaphore.

```ts
import { createSemaphore } from '@seahax/semaphore';

const abortController = new AbortController();
const semaphore = createSemaphore({
  // Abort signal to prevent new acquisitions (optional).
  signal: abortController.signal,
  // Maximum number of tokens (Default: 1)
  capacity: 1
});
```

Acquire a token, waiting until one is available if necessary.

```ts
const token = await semaphore.acquire();
```

Release the token when it is no longer needed.

```ts
try {
  // Do something with limited concurrency...
} finally {
  token.release();
}
```

## Controlled Functions

Async functions can be decorated so that they automatically acquire and release tokens when called.

```ts
const callback = semaphore.controlled(async (arg: string): Promise<void> => {
  // Do something with limited concurrency...
});

// The returned callback is curried so that the signal is provided by the
// semaphore. The signal is not passed in as an argument.
await callback('Hello, World!');
```

## Draining

It is possible to wait for all semaphore tokens to be released. This is useful for cleanup.

```ts
await semaphore.drain();
```
