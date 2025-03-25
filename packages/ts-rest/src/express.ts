import type { AppRoute, AppRouter } from '@ts-rest/core';
import {
  type AppRouteImplementation,
  type AppRouteOptions,
  createExpressEndpoints,
  type TsRestExpressOptions,
} from '@ts-rest/express';
import express, { type Router } from 'express';

type AppRouteImplementationOrOptions<TRoute extends AppRoute> =
  | AppRouteOptions<TRoute>
  | AppRouteImplementation<TRoute>;

export type RouterImplementation<TAppRouter extends AppRouter> = {
  [TKey in keyof TAppRouter]: TAppRouter[TKey] extends AppRouter
    ? RouterImplementation<TAppRouter[TKey]>
    : TAppRouter[TKey] extends AppRoute ? AppRouteImplementationOrOptions<TAppRouter[TKey]> : never;
};

export interface ExpressRouterOptions<TAppRouter extends AppRouter> extends TsRestExpressOptions<TAppRouter> {
  baseRouter?: Router;
}

/**
 * Create an Express Router implementation of the Router schema.
 *
 * Example:
 * ```ts
 * const router = initExpressRouter(routerSchema, {
 *   // Implementation of the router schema...
 * }, options);
 * ```
 *
 * This is equivalent to the following `@ts-rest/express` code:
 * ```ts
 * const router = express.Router();
 * createExpressEndpoints(routerSchema, {
 *   // Implementation of the router schema...
 * }, router, options);
 * ```
 */
export function initExpressRouter<TAppRouter extends AppRouter>(
  schema: TAppRouter,
  implementation: RouterImplementation<TAppRouter>,
  { baseRouter = express.Router(), ...options }: ExpressRouterOptions<TAppRouter> = {},
): Router {
  createExpressEndpoints(schema, implementation, baseRouter, {
    logInitialization: false,
    requestValidationErrorHandler: (err, req, res) => {
      res.status(400).json({ error: 'Bad Request' });
    },
    ...options,
  });

  return baseRouter;
}
