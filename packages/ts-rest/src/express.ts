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
 * Create an Express Router implementation of the Router spec.
 *
 * Example:
 * ```ts
 * const router = initExpressRouter(routerSpec, {
 *   // Implementation of the router spec...
 * }, options);
 * ```
 *
 * This is equivalent to the following `@ts-rest/express` code:
 * ```ts
 * const router = express.Router();
 * createExpressEndpoints(routerSpec, {
 *   // Implementation of the router spec...
 * }, router, options);
 * ```
 */
export function initExpressRouter<TAppRouter extends AppRouter>(
  spec: TAppRouter,
  implementation: RouterImplementation<TAppRouter>,
  { baseRouter = express.Router(), ...options }: ExpressRouterOptions<TAppRouter> = {},
): Router {
  createExpressEndpoints(spec, implementation, baseRouter, {
    logInitialization: false,
    requestValidationErrorHandler: (err, req, res) => {
      res.status(400).json({ error: 'Bad Request' });
    },
    ...options,
  });

  return baseRouter;
}
