# @seahax/fetch-intercept-throw

Intercept function for `@seahax/fetch` that throws on non-ok responses. Recommended to be early in the intercept chain, as not all intercepts may be expecting to handle errors.

## Usage

```ts
import interceptThrow from '@seahax/fetch-intercept-throw';

createFetch([
  // Throw on non-ok responses.
  interceptThrow(),
]);
```