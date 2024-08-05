# @seahax/fetch-intercept-timeout

Intercept function for `@seahax/fetch` that times out and cancels a request after an amount of time.

## Usage

```ts
import interceptTimeout from '@seahax/fetch-intercept-timeout';

createFetch([
  // Timeout all requests after 5 seconds.
  interceptTimeout(5),
  // Timeout only GET requests after 3 seconds.
  interceptTimeout(3, (request) => request.method === 'GET'),
]);
```
