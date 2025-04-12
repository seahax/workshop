# @seahax/ts-rest

An improved API over the TsRest `ContractInstance` returned by `initContract()`.

## Define Routes

```ts
import TsRest from '@seahax/ts-rest';
import { z } from 'zod';

export const apiContract = TsRest.routes({
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

## API

- `TsRest.routes()`: Define routes.
- `TsRest.route()`: Define a single route.
- `TsRest.responses()`: Define responses with statuses and schemas.
- `TsRest.response()`: Define a single response with a content type and body schema.
- `TsRest.type()`: Define a simple type schema without parsing (validation).
- `TsRest.noBody()`: Special body type for responses and requests without a body.
