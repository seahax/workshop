# @seahax/express-info

ExpressJS static server info handler.

## Example

The info handler can only serve a simple static map of key/value pairs, where the values are primitives. Technically, you could use getters to return dynamic data, but it should be avoided.

```ts
import express from 'express';
import info from '@seahax/express-info';

const app = express();

app.get('/_info', info({
  version: '1.0.0',
  startTime: new Date().toLocaleString(),
}));
```
