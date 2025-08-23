import { HEADER_CACHE_CONTROL } from '../../response/constants.ts';
import type { HeadersInit } from '../../response/options.ts';
import { createRoute, type Route } from '../route.ts';

export interface SpaOptions {
  readonly path?: string | readonly string[];
  readonly index?: string;
  readonly headers?: HeadersInit | ((filename: string) => HeadersInit);
}

export function createSpaRoute(
  root: string,
  { path: prefixes = '', index = 'index.html', headers }: SpaOptions = {},
): Route {
  const paths = (['/', '/{filename+}'] as const).flatMap((suffix): `${string}${typeof suffix}`[] => {
    return Array.isArray(prefixes)
      ? prefixes.map((prefix) => `${prefix}${suffix}` as const)
      : [`${prefixes}${suffix}`];
  });

  return createRoute('GET', paths, async (request, response) => {
    const { filename = '' } = await request.pathParameters();
    response.setHeader(HEADER_CACHE_CONTROL, 'max-age=0');
    await response.sendFile(root, filename, { headers, onNotFound: index });
  });
}
