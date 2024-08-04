# @seahax/fetch

Fetch instances with interception.

Axios, you're fat, you allow global configuration, and you still default to XMLHttpRequest.

## Overview

Create an intercept.

```ts
import { createIntercept } from '@seahax/fetch';

export default createIntercept(async (request, next) => {
  // Set headers. This doesn't require replacing the request.
  request.headers.set('Authorization', bearerToken);

  // Replace the request to modify readonly properties.
  const newRequest = new Request(request, {
    // If the request signal is replaced, the next() callback will create a
    // new combined signal from the old and new signals, so that aborting
    // either signal will still abort the request.
    signal: AbortSignal.timeout(5000),
  });

  try {
    // Invoke the next callback to continue the fetch process. Don't call it
    // if you want to short-circuit the request. Call it more than once for
    // retrying. The request argument only needs to be provided if the current
    // request is being replaced.
    return await next(newRequest);
  } catch (error) {
    // Handle errors, then (re-)throw or get a response some other way.
    throw error;
  }
});
```

Create a fetch instance with intercepts. This will wrap the global fetch function.

```ts
import { createFetch } from '@seahax/fetch';

export default createFetch([
  // Multiple intercepts are applied in order.
  firstIntercept,
  secondIntercept,
]);
```

Wrap a some other (non-global) fetch function by passing the function as the second argument.

```ts
export default createFetch([...], fetch);
```

Fetch functions created by this library are API compatible with the global fetch function. The arguments are the same, and the returned response is an _extension_ of the vanilla `globalThis.Response` class.

The returned response adds a `request` property that contains the request that was made, and an `assertOk()` method which throws a `ResponseError` if the response `status` is not `ok`.

```ts
import { type Response } from '@seahax/fetch';
import { fetch } from './path/to/my/fetch.js';

const { assertOk, request }: Response = await fetch('https://example.com');
```
