import type { AppRoute, AppRouter } from '@ts-rest/core';
import type express from 'express';

import type { ExpressRouteHandler } from './handler.ts';

export type ExpressRouterConfig<TAppRouter extends AppRouter> = {
  [TKey in keyof TAppRouter]: TAppRouter[TKey] extends AppRoute
    ? ExpressRouteHandler<TAppRouter[TKey]> | ExpressRouteConfig<TAppRouter[TKey]>
    : TAppRouter[TKey] extends AppRouter
      ? ExpressRouterConfig<TAppRouter[TKey]>
      : never;
};

export interface ExpressRouteConfig<TRoute extends AppRoute> {
  readonly middleware?: readonly express.RequestHandler[];
  readonly handler: ExpressRouteHandler<TRoute>;
}

/**
 * Create a single Express route implementation.
 */
export function createExpressRouteConfig<TAppRoute extends AppRoute>(
  appRoute: TAppRoute,
  configOrHandler: ExpressRouteConfig<TAppRoute> | ExpressRouteHandler<TAppRoute>,
): ExpressRouteConfig<TAppRoute> {
  return typeof configOrHandler === 'function'
    ? { handler: configOrHandler }
    : configOrHandler;
}
