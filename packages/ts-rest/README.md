# @seahax/ts-rest

Exposes a singleton ts-rest `ContractInstance`, rather than requiring `initContract()` to be called to create them.

## Create A Router Contract

```ts
import { contract } from '@seahax/ts-rest';
import { z } from 'zod';

export const apiContract = contract.router({
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