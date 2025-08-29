import type { IndexRouteObject, NonIndexRouteObject } from 'react-router';

export type SyncNonIndexRouteObject = Omit<NonIndexRouteObject, 'lazy'>;
export type SyncIndexRouteObject = Omit<IndexRouteObject, 'lazy'>;

export function route(options: SyncNonIndexRouteObject): SyncNonIndexRouteObject;
export function route(options: SyncIndexRouteObject): SyncIndexRouteObject;
export function route(
  options: SyncNonIndexRouteObject | SyncIndexRouteObject,
): SyncNonIndexRouteObject | SyncIndexRouteObject {
  return options;
}
