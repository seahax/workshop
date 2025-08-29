import type { IndexRouteObject, NonIndexRouteObject, RouteObject } from 'react-router';

import type { RouteDefinition } from './define-route.tsx';

export interface LazyNonIndexRouteOptions extends Omit<NonIndexRouteObject, 'lazy'> {
  readonly lazy: () => Promise<{ readonly default: RouteDefinition }>;
}

export interface LazyIndexRouteOptions extends Omit<IndexRouteObject, 'lazy'> {
  readonly lazy: () => Promise<{ readonly default: RouteDefinition }>;
}

export interface LazyNonIndexRouteObject extends Omit<NonIndexRouteObject, 'lazy'> {
  readonly lazy: RouteObject['lazy'] & {};
}

export interface LazyIndexRouteObject extends Omit<IndexRouteObject, 'lazy'> {
  readonly lazy: RouteObject['lazy'] & {};
}

export function lazyRoute({ lazy, ...options }: LazyNonIndexRouteOptions): LazyNonIndexRouteObject;
export function lazyRoute({ lazy, ...options }: LazyIndexRouteOptions): LazyIndexRouteObject;
export function lazyRoute({
  lazy,
  ...options
}: LazyIndexRouteOptions | LazyNonIndexRouteOptions): LazyIndexRouteObject | LazyNonIndexRouteObject {
  return {
    ...options as RouteObject,
    lazy: () => lazy().then((exports) => exports.default),
  };
}
