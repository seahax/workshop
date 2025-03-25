# @seahax/ts-rest

A wrapper for the [ts-rest](https://ts-rest.com/) API that improves the developer experience.

## Create A Router Spec

```ts
import { initRouter, schema, $Empty } from '@seahax/ts-rest';

export const routerSpec = initRouter({
  getUsers: {
    summary: 'Get a list of users.',
    method: 'GET',
    path: '/users',
    responses: {
      // Success with an type-only (no runtime validation) schema.
      200: schema<{
        items: User[],
        count: number,
      }>,
    },
  },
}, {
  commonResponses: {
    // Forbidden with on response body.
    403: $Empty,
  }
});
```

## Create An ExpressJS Router

```ts
import { initExpressRouter } from '@seahax/ts-rest';
import { routerSpec } from './my/router/spec';

export const router = initExpressRouter(routerSpec, {
  getUsers: async () => {
    const users = await getUsers();

    return {
      status: 200,
      body: {
        items: users,
        count: users.length,
      },
    }
  },
});
```
