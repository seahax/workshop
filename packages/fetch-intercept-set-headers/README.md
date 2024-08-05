# @seahax/fetch-intercept-set-headers

Intercept function for `@seahax/fetch` that sets request headers.

## Usage

False, null, and undefined values are treated as if they don't exist. Otherwise, this intercept replaces existing headers with any new values.

Function values are passed the request when invoked, and can return a value or a promise for a value.

```ts
import interceptSetHeaders from '@seahax/fetch-intercept-set-headers';

createFetch([
  // Set headers.
  interceptSetHeaders({
    'X-Number': 1,
    'X-String': 'value',

    // Object (record) values are serialized to JSON.
    'X-Json': { key: 'value' },

    // False, null, and undefined values are ignored.
    'X-Ignored': false,
    'X-Also-Ignored': null,
    'X-Still-Ignored': undefined,

    // Set multiple values with an array.
    'X-Multi-Value': [
      1, 'value',

      // Object (record) values are serialized to JSON.
      { key: 'value' },

      // False, null, and undefined values are filtered out.
      false, null, undefined,
    ],

    // An empty array removes the header.
    'X-Removed': [],
    'X-Also-Removed': [false, null, undefined],

    // Function values are called with the request, and should return the
    // header value.
    'Authorization': async (request) => {
      return request.url.startsWith('https://my.origin.com/')
        ? `Bearer ${await acquireToken()}`
        : null;
    },
  }),
]);
```

If a function is passed to `interceptSetHeaders` instead of an object, it can
return a headers object.

```ts
interceptSetHeaders(async (request) => {
  return {
    'Authorization': request.url.startsWith('https://my.origin.com/')
      ? `Bearer ${await acquireToken()}`
      : null;
  }
})
```

Alternatively, it can modify the request headers directly, without returning anything.

```ts
interceptSetHeaders(async (request) => {
  if (request.url.startsWith('https://my.origin.com/')) {
    request.headers.set(`Bearer ${await acquireToken()}`);
  }
});
```
