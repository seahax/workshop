import assert from 'node:assert';
import type { IncomingMessage } from 'node:http';
import type { Socket } from 'node:net';
import { TLSSocket } from 'node:tls';

import type { StandardSchemaV1 } from '@standard-schema/spec';

import type { ReadonlyIncomingHttpHeaders } from './readonly-incoming-http-headers.ts';
import { createSearchParametersProxy } from './search-parameters-proxy.ts';
import { validate } from './validate.ts';

export interface Request<
  TPathParameters extends Readonly<Partial<Record<string, string>>>,
> {
  /**
   * @internal
   */
  readonly $request: IncomingMessage;
  readonly socket: Socket;
  readonly method: string;
  readonly protocol: 'http' | 'https';
  readonly path: `/${string}`;
  readonly query: '' | `?${string}`;
  readonly url: `${'http' | 'https'}://${string}`;
  pathParameters<TOutput = TPathParameters>(schema?: StandardSchemaV1<unknown, TOutput>): Promise<TOutput>;
  queryParameters<TOutput = Readonly<Record<string, string | readonly string[]>>>(
    schema?: StandardSchemaV1<unknown, TOutput>
  ): Promise<TOutput>;
  headers<TOutput = ReadonlyIncomingHttpHeaders>(schema?: StandardSchemaV1<unknown, TOutput>): Promise<TOutput>;
  cookies<TOutput = Readonly<Record<string, string>>>(schema?: StandardSchemaV1<unknown, TOutput>): Promise<TOutput>;
  body<TOutput>(schema?: StandardSchemaV1<unknown, TOutput>): Promise<TOutput>;
}

interface RequestConfig<TPathParameters> {
  readonly request: IncomingMessage;
  readonly getPathParameters: () => TPathParameters;
  readonly getBody: () => Promise<unknown>;
}

export function createRequest<TPathParameters extends Readonly<Record<string, string>> = {}>({
  request,
  getPathParameters,
  getBody,
}: RequestConfig<TPathParameters>): Request<TPathParameters> {
  const { socket, method, url, headers } = request;
  const { localAddress, localPort, localFamily } = socket;

  assert.ok(method != null && url != null, 'Not an HTTP request');
  assert.ok(localAddress != null && localPort != null && localFamily != null, 'Socket is not connected');

  const protocol = socket instanceof TLSSocket ? 'https' : 'http';
  const hostname = localFamily === 'IPv6' ? `[${localAddress}]` : localAddress;

  let cachedUrl: URL | undefined;
  let cachedQueryParameters: Readonly<Record<string, string | readonly string[]>> | undefined;
  let cachedCookies: Readonly<Record<string, string>> | undefined;

  const getUrl = (): URL => {
    return cachedUrl ??= new URL(url, `${protocol}://${hostname}:${localPort}`);
  };
  const getQueryParameters = (): Readonly<Record<string, string | readonly string[]>> => {
    return cachedQueryParameters ??= createSearchParametersProxy(getUrl().searchParams);
  };
  const getCookies = (): Readonly<Record<string, string>> => {
    return cachedCookies ??= request.headers.cookie?.split(';')
      .reduce<Record<string, string>>((result, part) => {
        const i = part.indexOf('=');
        if (i === -1) return result;
        const key = decodeURIComponent(part.slice(0, i).trim());
        const value = decodeURIComponent(part.slice(i + 1).trim());
        result[key] = value;
        return result;
      }, {}) ?? {};
  };

  return {
    $request: request,
    socket: socket,
    method: method,
    protocol,
    get path() {
      return getUrl().pathname as `/${string}`;
    },
    get query() {
      return getUrl().search as '' | `?${string}`;
    },
    get url() {
      return getUrl().href as `${'http' | 'https'}://${string}`;
    },
    queryParameters: async (schema) => await validate(schema, getQueryParameters(), 'query'),
    pathParameters: async (schema) => await validate(schema, getPathParameters(), 'path'),
    headers: async (schema) => await validate(schema, headers, 'headers'),
    cookies: async (schema) => await validate(schema, getCookies(), 'cookies'),
    body: async (schema) => await validate(schema, getBody(), 'body'),
  };
}
