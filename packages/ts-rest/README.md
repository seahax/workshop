# @seahax/ts-rest

A wrapper for the [ts-rest](https://ts-rest.com/) API that improves the developer experience.

## Create A Router Schema

A router schema is similar to an an OpenAPI (Swagger) schema, but written in typescript. It outlines set of API endpoints in the abstract. The schema is then used when implementing the server API (eg. as an Express Router instance), and when creating the client (ie. SDK). It providing type safety in both cases, and also runtime validation on the server for request payloads.

```ts
import { initRouterSchema, NoBody } from '@seahax/ts-rest';
import { z } from 'zod';

export const routerSchema = initRouterSchema({
  getUsers: {
    summary: 'Get a list of users.',
    method: 'GET',
    path: '/users',
    responses: {
      200: z.object({ ... }),
    },
  },
}, {
  commonResponses: {
    // Forbidden response without a body.
    403: NoBody,
  }
});
```

## Create An ExpressJS Router

Define an ExpressJS Router that implements the router schema.

```ts
import { initExpressRouter } from '@seahax/ts-rest';
import { routerSchema } from './my/router/schema';

export const router = initExpressRouter(routerSchema, {
  getUsers: async () => {
    const users = await getUsers();

    return {
      status: 200,
      body: users,
    }
  },
});
```
