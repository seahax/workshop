# @seahax/semaphore

Asynchronous semaphore.

## Getting Started

Declare a semaphore.

```ts
import { createSemaphore } from '@seahax/semaphore';

const semaphore = createSemaphore({
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

await callback('Hello, World!');
```

## Aborting

The semaphore is also an `AbortController`. Calling the `abort` method prevents all future token acquisitions, which means that all unresolved and future `acquire` calls will reject with an `AbortError`.

```ts
semaphore.abort();
semaphore.signal.throwIfAborted();
```

## Draining

It is possible to wait for all semaphore tokens to be released. This is useful for cleanup. This works even if the semaphore is aborted.

```ts
await semaphore.drain();
```
