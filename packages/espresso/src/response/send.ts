import type { ServerResponse } from 'node:http';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

import vary from 'vary';

import { type CompressionProvider } from './compression.ts';
import { HEADER_ACCEPT_ENCODING, HEADER_CONTENT_ENCODING, HEADER_CONTENT_LENGTH } from './constants.ts';
import type { BodyInit, SendOptions } from './options.ts';

/**
 * Send the response, optionally with a body.
 *
 * The body can be any value that is compatible with the Fetch API `Response`
 * constructor, a Node `Readable` stream, or a function that returns one of
 * these types.
 */
export async function send(
  response: ServerResponse,
  compressionProvider: CompressionProvider | undefined,
  body: BodyInit | (() => BodyInit | Promise<BodyInit>),
  { status, headers }: SendOptions = {},
): Promise<void> {
  if (status != null) response.statusCode = status;
  if (headers != null) response.setHeaders(new Headers(headers));

  let data = await getBufferOrReadable(body);

  if (!data) {
    response.end();
    return;
  }

  if (!response.hasHeader('content-type')) {
    if (typeof body === 'string') {
      response.setHeader('content-type', 'text/plain');
    }
    else if (body instanceof URLSearchParams) {
      response.setHeader('content-type', 'application/x-www-form-urlencoded');
    }
  }

  if (Buffer.isBuffer(data)) {
    // Set the content length if the response is being generated from a
    // fixed length source.
    response.setHeader('Content-Length', data.length);
    data = Readable.from(data);
  }

  const compression = compressionProvider?.resolve(response);

  if (compression) {
    // Set the Vary response header to indicate that the Accept-Encoding
    // request header influences the response content.
    vary(response, HEADER_ACCEPT_ENCODING);
    // Set the content encoding that will be used.
    response.setHeader(HEADER_CONTENT_ENCODING, compression.encoding);
    // Clear the content length which no longer applies when the response is
    // compressed.
    response.removeHeader(HEADER_CONTENT_LENGTH);
  }

  if (response.req.method === 'HEAD') {
    // Drain the data stream since it will not be used. Destroying it would
    // also be an option, except that it might not be something that should be
    // destroyed (eg. it might be the IncomingMessage if implementing an echo
    // server).
    data.resume();
    response.end();
    return;
  }

  // Explicitly write the head in case pipe does not do so synchronously.
  response.writeHead(response.statusCode);

  if (compression) {
    await pipeline(data, compression.createStream(), response);
  }
  else {
    await pipeline(data, response);
  }
}

async function getBufferOrReadable(
  body: BodyInit | (() => BodyInit | Promise<BodyInit>),
): Promise<Buffer | Readable | undefined> {
  if (typeof body === 'function') body = await body();
  if (body == null) return;
  if (typeof body === 'string') return Buffer.from(body, 'utf8');
  if (body instanceof URLSearchParams) return Buffer.from(body.toString(), 'utf8');
  if (body instanceof Readable) return body;
  if (body instanceof ArrayBuffer) return Buffer.from(body);

  return Readable.from(body);
}
