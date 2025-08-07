import assert from 'node:assert';
import { type IncomingMessage, type Server as HttpServer, type ServerResponse } from 'node:http';
import { type Server as HttpsServer } from 'node:https';
import { type Readable } from 'node:stream';
import { TLSSocket } from 'node:tls';

import type { StandardSchemaV1 } from '@standard-schema/spec';

import type { WithApplication } from './application.ts';
import { memo } from './utils/memo.ts';

/**
 * Represents an HTTP request received by a server.
 */
export interface Request {
  /**
   * NodeJS request instance.
   */
  readonly $request: IncomingMessage;

  /**
   * NodeJS response instance.
   */
  readonly $response: ServerResponse;

  /**
   * The server instance that received the request.
   */
  readonly server: WithApplication<HttpServer> | WithApplication<HttpsServer>;

  /**
   * Will be aborted when attempting to close the owning application. This
   * implies the server is also closing.
   */
  readonly signal: AbortSignal;

  /**
   * The local IP address where the request was received.
   */
  readonly localAddress: string;

  /**
   * The local IP address family.
   */
  readonly localAddressFamily: 'IPv4' | 'IPv6';

  /**
   * The local port where the request was received.
   */
  readonly localPort: number;

  /**
   * The request protocol.
   */
  readonly protocol: 'http' | 'https';

  /**
   * The server name requested via SNI (Server Name Indication) if the request
   * was made over TLS.
   */
  readonly sniServerName: string | undefined;

  /**
   * The request method, such as `GET`, `POST`, etc.
   *
   * This will always be an uppercase string.
   */
  readonly method: string;

  /**
   * The path part of the request URL.
   */
  readonly path: `/${string}`;

  /**
   * The request headers.
   */
  readonly headers: Readonly<Record<string, string | readonly string[]>>;

  /**
   * The query (aka: search) search string.
   */
  readonly query: '' | `?${string}`;

  /**
   * The request query (aka: search) parameters parsed from the query string.
   */
  readonly queryParameters: Readonly<Record<string, string | readonly string[]>>;

  /**
   * The fully qualified URL of the request.
   *
   * The origin will be the local `<protocol>://<localAddress>:<localPort>`,
   * _not_ the origin used by the client. If you need URL with the origin used
   * by the client, it must be resolved based on _trusted_ `x-forwarded-*`
   * headers.
   */
  readonly url: `${'http' | 'https'}://${string}:${number}/${string}`;

  /**
   * The request body readable stream.
   */
  readonly body: Readable;

  /**
   * True if one of the body accessor methods has been called: `text()`,
   * `json()`, or `formData()`.
   */
  readonly bodyUsed: boolean;

  /**
   * Get the body as an array buffer.
   */
  arrayBuffer(): Promise<ArrayBuffer>;

  /**
   * Get the body parsed as UTF-8 text.
   */
  text(): Promise<string>;

  /**
   * Get the body parsed as JSON.
   */
  json(): Promise<unknown>;

  /**
   * Get the body parsed as URL-encoded form data.
   */
  formUrlEncoded(): Promise<unknown>;

  /**
   * Validate the request against a Standard Schema. If the request fails
   * validation, a `RequestValidationError` is thrown. The default error
   * handling will return a 400 Bad Request response for errors of this type.
   *
   * The request can optionally be preprocessed before validation.
   */
  validate<TOutput, TInput = this>(
    schema: StandardSchemaV1<unknown, TOutput>,
    preprocess?: (request: this) => TInput | Promise<TInput>
  ): Promise<TOutput>;
}

/**
 * Configuration for creating a request instance.
 */
export type RequestConfiguration = Pick<Request, '$request' | '$response' | 'server' | 'signal'>;

/**
 * Create a new request instance.
 */
export function createRequest({ $request, $response, server, signal }: RequestConfiguration): Request {
  assert.ok($request.socket.localAddress && $request.socket.localPort != null, 'Request socket destroyed.');
  assert.ok(
    $request.method
    && $request.url
    && ($request.socket.localFamily === 'IPv4' || $request.socket.localFamily === 'IPv6'),
    'Only HTTP(S) requests are supported.',
  );

  const protocol = $request.socket instanceof TLSSocket ? 'https' : 'http';
  const localAddress = $request.socket.localAddress;
  const localPort = $request.socket.localPort;
  const localAddressFamily = $request.socket.localFamily;
  const url = new URL($request.url, 'http://localhost');
  const path = url.pathname as `/${string}`;
  const query = url.search as '' | `?${string}`;

  const getQueryParameters = memo(() => getMultiMap(url.searchParams.entries()));
  const getFetchRequest = memo((): Pick<globalThis.Request,
    | 'bodyUsed'
    | 'arrayBuffer'
    | 'text'
    | 'json'
    | 'formData'
  > => {
    return new Request(url, {
      method: 'POST',
      body: $request,
      headers: {
        'content-type': $request.headers['content-type'],
      },
    });
  });

  const self: Request = {
    $request,
    $response,
    server,
    signal,
    method: $request.method.toUpperCase(),
    protocol,
    localAddress,
    localAddressFamily,
    localPort,
    path,
    query,
    url: `${protocol}://${localAddress}:${localPort}${path}${query}`,
    headers: $request.headers as Readonly<Record<string, string | readonly string[]>>,
    body: $request,
    sniServerName: 'servername' in $request.socket && typeof $request.socket.servername === 'string'
      ? $request.socket.servername
      : undefined,
    get queryParameters() {
      return getQueryParameters();
    },
    get bodyUsed() {
      return getFetchRequest().bodyUsed;
    },
    async arrayBuffer() {
      return await getFetchRequest().arrayBuffer();
    },
    async text() {
      return await getFetchRequest().text();
    },
    async json() {
      return await getFetchRequest().json();
    },
    async formUrlEncoded() {
      return getMultiMap(new URLSearchParams(await self.text()).entries());
    },
    async validate(schema, preprocess) {
      const input = preprocess ? await preprocess(this) : this;
      const result = await schema['~standard'].validate(input);

      if (result.issues) {
        throw new RequestValidationError(result.issues);
      }

      return result.value;
    },
  };

  return self;
}

/**
 * Convert entries (key-value tuples) where the key may occur more than once
 * and the value may be an array, into a JS object "multi-map" where each key
 * maps to all of the values associated with that key in the entries array.
 */
function getMultiMap<TValue>(
  entries: Iterable<[string, TValue | readonly TValue[]]>,
): Readonly<Record<string, NonNullable<TValue> | readonly NonNullable<TValue>[]>> {
  const result: Record<string, NonNullable<TValue> | NonNullable<TValue>[]> = {};

  function addOne(key: string, value: TValue): void {
    if (value == null) {
      return;
    }

    if (key in result) {
      const currentValue = result[key]!;

      if (Array.isArray(currentValue)) {
        currentValue.push(value);
      }
      else {
        result[key] = [currentValue, value];
      }
    }
    else {
      result[key] = value;
    }
  }

  for (const [key, value] of entries) {
    if (Array.isArray(value)) {
      value.forEach((v) => addOne(key, v));
    }
    else {
      addOne(key, value);
    }
  }

  return result;
}

/**
 * Thrown by the request `validate()` method if validation fails. This event is
 * also a Standard Schema failure result (contains an issues array).
 */
export class RequestValidationError extends Error implements StandardSchemaV1.FailureResult {
  readonly issues: readonly StandardSchemaV1.Issue[];

  constructor(issues: readonly StandardSchemaV1.Issue[]) {
    super('Request validation failed');
    this.name = 'RequestValidationError';
    this.issues = issues;
  }
}
