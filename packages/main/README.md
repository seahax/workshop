# @seahax/main

Modify the NodeJS global context to better support CLI applications.

Features:
- Better uncaught exception and unhandled rejection handling.
- Fix stack traces with source maps.

## Usage

The package should just be imported at the top of your entry file.

```ts
import '@seahax/main';
```

## Errors

An `AbortError` exits the process without printing an error message.

```ts
import { AbortError } from '@seahax/main/errors';

new AbortError();
```
