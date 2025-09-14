# @seahax/semaphore

Asynchronous semaphore.

- [Getting Started](#getting-started)
- [Mutex](#mutex)
- [Controlled Functions](#controlled-functions)
- [Draining](#draining)


## Getting Started

Declare a semaphore.

```ts
import { createSemaphore } from '@seahax/semaphore';

const abortController = new AbortController();
const semaphore = createSemaphore({
  // Abort signal to prevent new acquisitions (optional).
  signal: abortController.signal,
  // Maximum number of locks (Default: 1)
  capacity: 1
});
```

Acquire a lock, waiting until one is available if necessary.

```ts
const lock = await semaphore.acquire();
```

Release the lock when it is no longer needed.

```ts
try {
  // Do something with limited concurrency...
} finally {
  lock.release();
}
```

## Mutex

A mutex (mutually exclusive lock) is a semaphore with a capacity of 1.

```ts
import { createMutex } from '@seahax/semaphore';

const mutex = createMutex({
  // Options are the same as createMetaphore, except capacity is always 1.
});
```

## Controlled Functions

Async functions can be decorated so that they automatically acquire and release locks when called.

```ts
const callback = semaphore.controlled(async (arg: string): Promise<void> => {
  // Do something with limited concurrency...
});

// The returned callback is curried so that the signal is provided by the
// semaphore. The signal is not passed in as an argument.
await callback('Hello, World!');
```

## Draining

It is possible to wait for all semaphore locks to be released. This is useful for cleanup.

```ts
await semaphore.drain();
```
