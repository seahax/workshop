import { contract } from '@seahax/ts-rest';
import { addExpressRoutes } from '@seahax/ts-rest-express';
import express from 'express';
import morgan from 'morgan';
import { z } from 'zod';

const apiContract = contract.router({
  root: {
    method: 'GET',
    path: '/:foo?',
    pathParams: z.object({
      foo: z.string().optional(),
    }),
    query: z.object({
      bar: z.number({ coerce: true }).optional(),
    }).strict(),
    headers: z.object({
      accept: z.string().optional(),
    }),
    responses: {
      200: z.object({
        message: z.string(),
        debug: z.any().optional(),
      }),
    },
  },
});

const app = express();
app.use(morgan('tiny'));

addExpressRoutes(app, apiContract, {
  root: async ({ headers, params, query }) => {
    return {
      status: 200,
      body: {
        message: 'Hello, World!',
        debug: {
          headers,
          params,
          query,
        },
      },
    };
  },
});

app.listen(3000, () => {
  console.log('Server is running on http://127.0.0.1:3000');
});
