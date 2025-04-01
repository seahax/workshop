# @seahax/express-health

ExpressJS health check handler.

## Example

Define a health check function. A health check function is just a function that takes no arguments and returns a boolean promise.

```ts
export function pingMongo(): Promise<void> {
  try {
    await client.db().command({ ping: 1 });
    return true;
  } catch (error) {
    console.error('MongoDB ping failed', error);
    return false
  }
}
```

Pass one or more health check functions to the health router.

```ts
import express from 'express';
import health from '@seahax/express-health';
import { pingMongo } from './health-checks';

const app = express();

app.get('/_health', health({ pingMongo }));
```

When a request is made to the handler return the most recent status of all the health check functions.

```json
{
  "status": true,
  "checks": {
    "pingMongo": true
  }
}
```

The status and checks values may also be `"starting"` if any health checks have not yet run for the first time.

## Check Frequency

Health check functions are _NOT_ run when the handler is invoked. If they were, it would potentially create an effective way to DoS your server.

Instead, each health check functions are scheduled on an interval. The handler only returns the result of the most recent invocation of each check function.

By default, the interval is 30 seconds, and each health check is run the first time as soon as the handler is created (no initial delay). You can change this by passing options.

```ts
health({
  pingMongo
}, {
  // Run health check functions every 60 seconds.
  intervalSeconds: 60,
  // Wait 2 minutes before running a health check function for the first time.
  initialDelaySeconds: 120, 
});
```

## Check Hooks

If you want to run some code before each health check starts or after each health check ends, you can use the `onCheckStart` and `onCheckEnd` hooks. This is intended for logging or emitting metrics.

```ts
health({
  pingMongo
}, {
  onCheckStart: (name) => {
    console.log(`Health check "${name}" started.`);
  },
  onCheckEnd: (name, result, error) => {
    console.log(`Health check "${name}" ${result ? 'passed' : 'failed'}`, error);
  }
})
```
