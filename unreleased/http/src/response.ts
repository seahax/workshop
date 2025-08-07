import fs from 'node:fs/promises';
import type { ServerResponse } from 'node:http';
import path from 'node:path';
import { Readable } from 'node:stream';

import mime from 'mime';

/**
 * Represents an HTTP response that will be sent to the client.
 */
export interface Response {
  readonly status: number;
  readonly headers: Headers;
  readonly body: ResponseBody;
}

/**
 * Options for creating a response.
 */
export interface ResponseOptions {
  readonly status?: number;
  readonly headers?: ConstructorParameters<typeof Headers>[0];
  readonly body?: ResponseBody;
}

/**
 * Response body types.
 */
export type ResponseBody = (
  | ConstructorParameters<typeof Response>[0]
  | Readable
  | (() => Iterable<Uint8Array>)
  | (() => AsyncIterable<Uint8Array>)
);

/**
 * Options for sending a response.
 */
export interface SendResponseOptions {
  /**
   * Whether to send the response body. If `false`, only the headers will be
   * sent, and the response will be considered complete. Defaults to `true`.
   */
  readonly sendBody?: boolean;
}

/**
 * Create a new response.
 */
export function createResponse({ status = 200, headers, body }: ResponseOptions = {}): Response {
  return { status, headers: headers instanceof Headers ? headers : new Headers(headers), body };
}

/**
 * Send an application response through a NodeJS HTTP server response instance.
 */
export function sendResponse(
  nodeResponse: ServerResponse,
  response: Response,
  { sendBody = true }: SendResponseOptions = {},
): void {
  if (nodeResponse.headersSent) {
    // Nothing to do if the response has already been written.
    return;
  }

  let body: Readable | undefined | null;

  if (sendBody && response.body) {
    if (response.body instanceof Readable) {
      body = response.body;
    }
    else {
      const bodyInit = typeof response.body === 'function' ? response.body() : response.body;
      const fetchResponse = new Response(bodyInit, { headers: response.headers });
      body = fetchResponse.body && Readable.fromWeb(fetchResponse.body);
    }
  }

  nodeResponse.writeHead(response.status, Object.fromEntries(response.headers.entries()));
  body?.pipe(nodeResponse);
  nodeResponse.end();
}

/**
 * Create a JSON response.
 */
function json(body: unknown, init?: Omit<ResponseOptions, 'body'>): Response {
  const response = createResponse({ ...init, body: JSON.stringify(body) });
  response.headers.set('Content-Type', 'application/json');
  return response;
}

/**
 * Create a text response.
 */
function text(body: string, init?: Omit<ResponseOptions, 'body'>): Response {
  const response = createResponse({ ...init, body });

  if (!response.headers.has('Content-Type')) {
    // Set default content type if not already set.
    response.headers.set('Content-Type', 'text/plain');
  }

  return response;
}

/**
 * Creates a response that serves a file from the filesystem. The `filename`
 * can be relative or absolute, but must be a subpath of the `root`.
 *
 * Note: The file is not opened until the response body is read. Therefore,
 * it's safe to discard the returned response without worrying about dangling
 * file handles, as long as the body is not read.
 */
async function file(root: string, filename: string, init?: Omit<ResponseOptions, 'body'>): Promise<Response> {
  const absolutePath = path.resolve(root, filename);
  const relativePath = path.relative(root, absolutePath);

  // Prevent directory traversal attacks by ensuring the file is within the
  // specified root directory.
  if (!relativePath || relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    return json(
      { error: 'Forbidden' },
      { status: 403 },
    );
  }

  const isAccessible = await fs.access(absolutePath, fs.constants.R_OK).then(() => true, () => false);

  if (!isAccessible) {
    return json(
      { error: 'Not Found' },
      { status: 404 },
    );
  }

  const generator = async function* (): AsyncGenerator<Uint8Array> {
    const fileHandle = await fs.open(absolutePath, fs.constants.O_RDONLY);
    const readStream = fileHandle.createReadStream({ autoClose: true });
    yield* readStream;
  };

  const response = createResponse({ ...init, body: generator });
  const contentType = mime.getType(absolutePath) || 'application/octet-stream';
  response.headers.set('Content-Type', contentType);
  return response;
}

/**
 * Common response creation utilities.
 */
export const response = { json, text, file } as const;
