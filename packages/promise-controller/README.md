# @seahax/promise-controller

Externally resolvable promises following the `AbortController` pattern.

## Getting Started

Create the controller.

```ts
import { PromiseController } from '@seahax/promise-controller';

const controller = new PromiseController<string>();
```

Call the `resolve` or `reject` method to settle the promise.

```ts
controller.resolve('Hello, World!');
controller.reject(new Error('Something went wrong.'));
```

Await the controller `promise`.

```ts
const result = await controller.promise;
```
