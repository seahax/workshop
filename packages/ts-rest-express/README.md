# @seahax/ts-rest-express

An Express v5 alternative to [@ts-rest/express](https://www.npmjs.com/package/@ts-rest/express). 

- Type improvements.
- Fewer options for things that can be done using Zod types.
- Better error handling.
- Better support for per-route middleware.
- Return response headers and cookies.

## Usage

```ts
import { addExpressRoutes } from '@seahax/ts-rest-express';
import { initContract } from '@ts-rest/core';
import express from 'express';
import { z } from 'zod';

const app = express();
const contract = initContract();
const router = contract.router({
  foo: {
    method: 'GET',
    path: '/foo/:name?',
    pathParams: z.object({
      name: z.string().optional(),
    }),
    responses: {
      200: z.object({ message: z.string() }),
    },
  },
});

addExpressRoutes(app, router, {
  foo: ({ params }) => {
    return {
      status: 200,
      headers: {
        'X-Foo': 'bar',
      },
      cookies: {
        'foo': { value: 'bar', httpOnly: true, sameSite: 'strict' },
      },
      body: { message: `Hello, ${params.name ?? 'World'}!` },
    };
  },
});
```
