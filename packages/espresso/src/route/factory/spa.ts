import type { Request } from '../../request/request.ts';
import { HEADER_CACHE_CONTROL } from '../../response/constants.ts';
import type { HeadersInit } from '../../response/options.ts';
import { createRoute, type Route } from '../route.ts';

type Match = (
  | RegExp
  | ((request: Request<{}>) => boolean)
  | readonly (
    | RegExp
    | ((request: Request<{}>) => boolean)
  )[]
);

export interface SpaOptions {
  readonly path?: string | readonly string[];
  readonly headers?: HeadersInit | ((filename: string) => HeadersInit);
  readonly index?: string;
  readonly include?: Match;
  readonly exclude?: Match;
}

export function createSpaRoute(
  root: string,
  { path: prefixes = '', headers, index = 'index.html', include, exclude }: SpaOptions = {},
): Route {
  const paths = (['/', '/{filename+}'] as const).flatMap((suffix): `${string}${typeof suffix}`[] => {
    return Array.isArray(prefixes)
      ? prefixes.map((prefix) => `${prefix}${suffix}` as const)
      : [`${prefixes}${suffix}`];
  });
  const includeArray = Array.isArray(include) ? include : (include ? [include] : []);
  const excludeArray = Array.isArray(exclude) ? exclude : (exclude ? [exclude] : []);

  return createRoute('GET', paths, async (request, response) => {
    const { filename = index } = await request.pathParameters();
    const isIncluded = filename === index || includeArray.length === 0 || includeArray.some((match) => {
      return typeof match === 'function' ? match(request) : match.test(filename);
    });
    const isExcluded = !isIncluded || excludeArray.some((match) => {
      return typeof match === 'function' ? match(request) : match.test(filename);
    });

    // The filename is excluded (or not included), so don't handle the request,
    // allowing the default handlers to take over. If there are no default
    // handlers, this will result in a 404 response.
    if (isExcluded) return;

    response.setHeader(HEADER_CACHE_CONTROL, 'max-age=0');
    await response.sendFile(root, filename, { headers, onNotFound: index });
  });
}
