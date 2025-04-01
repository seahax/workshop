# @seahax/express-spa

ExpressJS static file router with SPA fallback support.

## Example

```ts
import express from 'express';
import spa, { defaultCacheControl } from '@seahax/express-spa';

const app = express();

app.use(spa('path/to/static/root', {
  // Defaults are shown.
  indexFilename: 'index.html',
  cacheControl: defaultCacheControl,
}));
```

## Cache Control

The `cacheControl` option can be a string or a function that returns a string based on the request path.