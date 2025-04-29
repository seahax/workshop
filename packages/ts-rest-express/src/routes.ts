import assert from 'node:assert';

import { type AppRoute, type AppRouter, isAppRoute } from '@ts-rest/core';
import type * as express from 'express';

import { createExpressRouteConfig, type ExpressRouteConfig, type ExpressRouterConfig } from './config.ts';
import { type ExpressRouteHandler, getExpressRequestHandler } from './handler.ts';

interface RouterConfig {
  [key: string]: ExpressRouteHandler<AppRoute> | ExpressRouteConfig<AppRoute> | RouterConfig;
}

/**
 * Add routes to an Express router based on the provided TsRest router.
 */
export function addExpressRoutes<TExpressRouter extends express.Router, TAppRouter extends AppRouter>(
  expressRouter: TExpressRouter,
  appRouter: TAppRouter,
  routerConfig: ExpressRouterConfig<TAppRouter>,
): TExpressRouter {
  addRouter(expressRouter, appRouter, routerConfig as RouterConfig, '');
  return expressRouter;
}

function addRouter(
  expressRouter: express.Router,
  appRouter: AppRouter,
  routerConfig: RouterConfig,
  routerPath: string,
): void {
  for (const [key, appRouteOrRouter] of Object.entries(appRouter)) {
    const config = routerConfig[key];

    if (isAppRoute(appRouteOrRouter)) {
      assert.ok(isRouteConfigOrHandler(config), `Invalid route config at "${routerPath}".`);
      addRoute(expressRouter, appRouteOrRouter, config);
    }
    else {
      assert.ok(isRouterConfig(config), `Invalid route config at "${routerPath}".`);
      addRouter(expressRouter, appRouteOrRouter, config, routerPath ? `${routerPath}.${key}` : key);
    }
  }
}

function addRoute(
  expressRouter: express.Router,
  appRoute: AppRoute,
  routeConfig: ExpressRouteConfig<AppRoute> | ExpressRouteHandler<AppRoute>,
): void {
  routeConfig = createExpressRouteConfig(appRoute, routeConfig);

  const handler = getExpressRequestHandler(appRoute, routeConfig.handler);
  // Convert the HTTP method into an Express route registration method.
  const method = appRoute.method.toLowerCase() as Lowercase<AppRoute['method']>;
  // Convert TsRest path parameters into Express v5 path parameters.
  const path = appRoute.path.replaceAll(/(?:^|\/)(:[^/?]+)\?/g, '{/$1}');

  expressRouter[method](path, ...routeConfig.middleware ?? [], handler);
}

function isRouteConfigOrHandler(value: unknown): value is ExpressRouteConfig<AppRoute> | ExpressRouteHandler<AppRoute> {
  return typeof value === 'function' || (
    typeof value === 'object' && value != null && 'handler' in value && typeof (value.handler) === 'function'
  );
}

function isRouterConfig(value: unknown): value is RouterConfig {
  return typeof value === 'object' && value != null;
}
