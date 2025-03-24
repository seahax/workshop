import type { AppRoute } from '@ts-rest/core';
import { type AppRouteImplementation, type AppRouteOptions, createExpressEndpoints } from '@ts-rest/express';
import express, { type Router } from 'express';

export type AppRouteImplementationOrOptions<TRoute extends AppRoute> =
  | AppRouteOptions<TRoute>
  | AppRouteImplementation<TRoute>;

export type ApiImplementation<TApi extends Api> = {
  [TKey in keyof TApi]: TApi[TKey] extends Api
    ? ApiImplementation<TApi[TKey]>
    : TApi[TKey] extends AppRoute ? AppRouteImplementationOrOptions<TApi[TKey]> : never;
};

export interface Api {
  [key: string]: Api | AppRoute;
}

export function initExpressRouter<TApi extends Api>(
  api: TApi,
  implementation: ApiImplementation<TApi>,
  router: Router = express.Router(),
): Router {
  createExpressEndpoints(api, implementation, router, {
    logInitialization: false,
    requestValidationErrorHandler: (err, req, res) => {
      res.status(400).json({ error: 'Bad Request' });
    },
  });

  return router;
}
