# @seahax/fetch-intercept-retry

Intercept function for `@seahax/fetch` that retries requests.

## Usage

```ts
import interceptRetry from '@seahax/fetch-intercept-retry';

createFetch([
  // Retry with defaults.
  interceptRetry(),
]);
```

The default retry algorithm can be configured by passing a `RetryOptions` object.

```ts
import interceptRetry, { isDefaultRetryable } from '@seahax/fetch-intercept-retry';

interceptRetry({
  // Maximum number of retries.
  count: 5,
  // Base (aka: initial) delay for the exponential backoff algorithm.
  baseSeconds: 1,
  // Cap on the maximum delay for the exponential backoff algorithm.
  capSeconds: 30,
  // Predicate function to determine if a response should be retried.
  isRetryable: isDefaultRetryable,
});
```

For more advanced control, you can use a `RetryCallback` function. The function is passed a response and the number of retry attempts that have been made. It should return the `number` of seconds to delay before the next retry, or `false` if no more retries should be attempted.

```ts
import interceptRetry, { isDefaultRetryable, getDefaultDelaySeconds } from '@seahax/fetch-intercept-retry';

interceptRetry((response, attempts) => {
  if (attempts < 5 && isDefaultRetryable(response)) {
    return getDefaultDelaySeconds(attempts, {
      baseSeconds: 1,
      capSeconds: 30,
    });
  }

  return false;
});
```

## Retry Defaults

Defaults when the intercept is used with no configuration.

### Delay Algorithm

Exponential backoff with a random jitter.

```
random_between( 0, min( cap, base * 2 ^ attempt ) )
```

The default `base` is `1` second, and the default `cap` is `30` seconds. This algorithm is implemented in the `getDefaultDelaySeconds` function.

### Conditions

The request method was idempotent, and the response status code indicates an error that may resolve with an unmodified retry.

Methods that are idempotent:

- `GET`
- `HEAD`
- `OPTIONS`
- `PUT`
- `DELETE`

Status codes that may resolve with an unmodified retry:

- `408` Request Timeout (probably a network issue)
- `425` Too Early (probably SSL negotiation related)
- `500` Internal Server Error
- `502` Bad Gateway
- `503` Service Unavailable
- `504` Gateway Timeout

> **Note:** The `429` (too many requests) status code specifically indicates that the client should retry after some time. But, it's not included in the default conditions, because it probably indicates a significant wait time (minutes, hours, or days) due to something like an API rate limit. That delay should probably be surfaced to the user or handled by application logic.
