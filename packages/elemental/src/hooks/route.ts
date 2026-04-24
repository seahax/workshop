import type { Ref } from '../component.ts';
import { getRouter } from '../router.ts';
import { useEffect, useRef } from './core.ts';

export interface RouteOptions {
  readonly match?: 'prefix' | 'exact' | RegExp;
  readonly source?: 'pathname' | 'hash';
}

export type RouteMatchArray = readonly [string, ...string[]] & { readonly groups: Record<string, string> };

export function useRoute(
  path: string | readonly string[],
  { match = 'prefix', source = 'pathname' }: RouteOptions = {},
): [match: Ref<RouteMatchArray | null>, state: Ref<unknown>] {
  const matchRx = match === 'exact' ? /^$/u : match === 'prefix' ? /^.*$/u : match;
  const paths = Array.isArray(path) ? (path as readonly string[]) : [path as string];

  const getMatch = (url: string): RouteMatchArray | null => {
    let value = new URL(url)[source];
    const prefix = paths.find((path) => value.endsWith(path)) ?? null;
    if (prefix == null) return null;
    value = value.slice(prefix.length);
    return value.match(matchRx) as RouteMatchArray | null;
  };

  const refUrl = useRef<string>(window.location.href);
  const refMatch = useRef<RouteMatchArray | null>(getMatch(window.location.href));
  const refState = useRef<unknown>(window.history.state);

  useEffect([], () =>
    getRouter().subscribe(({ url, state }) => {
      refUrl.value = url;
      refState.value = state;
    }),
  );

  useEffect([refUrl], (url) => {
    refMatch.value = getMatch(url);
  });

  return [refMatch, refState];
}
