import {
  type ApiFetcherArgs,
  type AppRoute,
  type AppRouter,
  type AppRouteResponse,
  getRouteQuery,
  type initClient as initClientSuper,
  type InitClientArgs,
  isAppRoute,
  isAppRouteNoBody,
  isAppRouteOtherResponse,
  isZodType,
} from '@ts-rest/core';
import type { ZodError } from 'zod';

export type TsRestClient<
  TRouter extends AppRouter,
  TOptions extends TsRestClientOptions | string | URL,
> = ReturnType<typeof initClientSuper<
  TRouter,
  { baseUrl: string } & (TOptions extends string | URL ? InitClientArgs : Omit<TOptions, 'baseUrl'>)
>>;

export interface TsRestFetchResult {
  status: number;
  headers: Headers;
  body: unknown;
}

export interface TsRestClientOptions extends Omit<InitClientArgs, 'baseUrl'> {
  baseUrl?: string | URL;
}

export function initClient<TRouter extends AppRouter, TOptions extends TsRestClientOptions | string | URL = {}>(
  router: TRouter,
  optionsOrBaseUrl?: TOptions,
): TsRestClient<TRouter, TOptions> {
  return Object.fromEntries(Object.entries(router).map(([key, value]) => [key, isAppRoute(value)
    ? getRouteQuery(value, getClientArgs(optionsOrBaseUrl, value))
    : initClient(value, optionsOrBaseUrl),
  ])) as TsRestClient<TRouter, TOptions>;
};

export async function tsRestFetchApi(options: ApiFetcherArgs): Promise<TsRestFetchResult> {
  const { path, fetchOptions, method, headers, body, route, validateResponse = true } = options;
  const response = await fetch(path, { ...fetchOptions, method, headers, body });
  const result: TsRestFetchResult = {
    status: response.status,
    headers: response.headers,
    body: await getResponseBody(response),
  };

  if (validateResponse) {
    const routeResponse = route.responses[response.status];
    validateResponseContentType(result, routeResponse);
    validateResponseBody(result, routeResponse);
  }

  return result;
}

function getClientArgs(
  optionsOrBaseUrl: TsRestClientOptions | string | URL | undefined,
  route: AppRoute,
): InitClientArgs {
  const { baseUrl = '/', api, throwOnUnknownStatus, ...otherArgs } = (
    optionsOrBaseUrl == null || typeof optionsOrBaseUrl === 'string' || optionsOrBaseUrl instanceof URL
      ? { baseUrl: optionsOrBaseUrl }
      : optionsOrBaseUrl
  );

  return {
    ...otherArgs,
    baseUrl: getNormalizedBaseUrl(baseUrl),
    api: api ?? tsRestFetchApi,
    throwOnUnknownStatus: throwOnUnknownStatus ?? route.strictStatusCodes ?? true,
  };
}

function getNormalizedBaseUrl(url: string | URL): string {
  if (typeof url !== 'string') return url.href;
  if (typeof window !== 'undefined') return new URL(url, window.location.href).href;
  return url;
}

async function getResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type');
  if (contentType?.startsWith('application/') && contentType.includes('json')) return await response.json();
  if (contentType?.startsWith('text/')) return await response.text();
  return response.blob();
}

function getRouteResponseExpectedContentType(routeResponse: AppRouteResponse | undefined): string | undefined {
  if (!routeResponse) return undefined;
  if (isAppRouteNoBody(routeResponse)) return undefined;
  if (isAppRouteOtherResponse(routeResponse)) return routeResponse.contentType.trim().toLowerCase();
  return 'application/json';
}

function validateResponseContentType(
  result: TsRestFetchResult,
  routeResponse: AppRouteResponse | undefined,
): void {
  const expectedContentType = getRouteResponseExpectedContentType(routeResponse);
  if (!expectedContentType) return;
  const rawContentType = result.headers.get('content-type');
  const contentType = expectedContentType.includes(';')
    ? rawContentType?.trim().toLowerCase()
    : rawContentType?.split(';')[0]?.trim().toLowerCase();
  if (contentType !== expectedContentType) throw new InvalidContentTypeError(result, expectedContentType);
}

function validateResponseBody(response: TsRestFetchResult, routeResponse: AppRouteResponse | undefined): void {
  if (routeResponse === undefined) return;
  const body = isAppRouteOtherResponse(routeResponse) ? routeResponse.body : routeResponse;
  if (!isZodType(body)) return;
  const result = body.safeParse(response.body);
  if (!result.success) throw new InvalidResponseBodyError(response, result.error);
  response.body = result.data;
}

export class InvalidContentTypeError extends Error {
  readonly response: TsRestFetchResult;

  constructor(response: TsRestFetchResult, expectedContentType: string) {
    const contentType = response.headers.get('content-type');
    super(`Server returned an invalid content type (expected: ${expectedContentType}, got: ${contentType})`);
    this.response = response;
  }
}

export class InvalidResponseBodyError extends Error {
  readonly response: TsRestFetchResult;

  constructor(response: TsRestFetchResult, error: ZodError) {
    super(`Server returned an invalid body: ${error.message}`, { cause: error });
    this.response = response;
  }
}
