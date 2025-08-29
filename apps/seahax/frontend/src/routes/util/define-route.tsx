import type { LazyRouteFunction, RouteObject } from 'react-router';

export type RouteDefinition = Awaited<ReturnType<LazyRouteFunction<RouteObject>>>;

export default function defineRoute(route: RouteDefinition): RouteDefinition {
  return route;
}
