# @seahax/main

Modify the NodeJS global context to better support CLI applications.

Features:
- Error stack trace source map support.
- Uncaught error handling.
- Console log level filtering.

Table of Contents:
- [@seahax/main](#seahaxmain)
  - [Usage](#usage)
  - [Log Level](#log-level)
  - [Default Error Handler](#default-error-handler)
  - [Custom Error Handlers](#custom-error-handlers)
  - [Before Log Handlers](#before-log-handlers)
  - [Main Function](#main-function)


## Usage

Modify the global context.

```ts
import '@seahax/main';
```

## Log Level

These levels are supported.

- `error`
- `warn`
- `info`
- `debug`

Check the log level.

```ts
import { isLogLevel, LogLevel } from '@seahax/main';

if (isLogLevel(LogLevel.warn)) {
  // Do something only if "warn" level logging is enabled.
}
```

Set the log level.

```ts
import { setLogLevel, LogLevel } from '@seahax/main';

setLogLevel(LogLevel.warn);
```

The log level can also be set using the `LOG_LEVEL` environment variable.

```sh
process.env.LOG_LEVEL = 'warn';
```

## Default Error Handler

The default error handler prints errors without stack traces, unless the log level is set to `debug`.

Abort errors are not printed at all.

## Custom Error Handlers

Register custom error handlers for uncaught errors.

```ts
import { registerErrorHandler } from '@seahax/main';

registerErrorHandler({ type: TypeError }, (error) => {
  // Do something if the uncaught error is an instance of TypeError.
});

registerErrorHandler({ name: 'ErrorName'}, (error) => {
  // Do something if the uncaught error "name" is "ErrorName".
});

registerErrorHandler({ code: 'ErrorCode'}, (error) => {
  // Do something if the uncaught error "code" is "ErrorCode".
});

registerErrorHandler({ match: isSomeErrorType }, (error) => {
  // Do something if the uncaught error matches a predicate.
});
```

An `unregister` callback is returned which removes the error handler when called.

```ts
const unregister = registerErrorHandler(...);
unregister();
```

## Before Log Handlers

Register callbacks that are invoked before each log message is written. For example, this could be used to clear a status spinner before logging, so that the spinner doesn't interfere with log output.

```ts
import { registerBeforeLogHandler } from '@seahax/main';

registerBeforeLogHandler(() => { ... });
```

An `unregister` callback is returned which removes the callback when called.

```ts
const unregister = registerBeforeLogHandler(...);
unregister();
```

## Main Function

Run a main function. Wrapping CLI logic in a function allows for async code without a top-level `await`. It also supports returning early without calling the `process.exit` function.

```ts
import { main } from '@seahax/main';

main(async () => {
  // Do something.
});
```