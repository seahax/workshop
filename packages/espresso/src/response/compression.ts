import type { ServerResponse } from 'node:http';
import type { Duplex } from 'node:stream';
import zlib from 'node:zlib';

import compressible from 'compressible';
import Negotiator from 'negotiator';

import {
  HEADER_CACHE_CONTROL,
  HEADER_CONTENT_ENCODING,
  HEADER_CONTENT_LENGTH,
  HEADER_CONTENT_TYPE,
} from './constants.ts';
import type { CompressionOptions } from './options.ts';

export interface Compression {
  createStream: () => Duplex;
  encoding: string;
}

export interface CompressionProvider {
  resolve(response: ServerResponse): Compression | undefined;
}

export function createCompressionProvider({
  minimumBytes = 1024,
  filter = (): boolean => true,
  createZstd = 'createZstdCompress' in zlib ? () => zlib.createZstdCompress() : undefined,
  createBrotli = 'createBrotliCompress' in zlib ? () => zlib.createBrotliCompress() : undefined,
  createDeflate = 'createDeflate' in zlib ? () => zlib.createDeflate() : undefined,
  createGzip = 'createGzip' in zlib ? () => zlib.createGzip() : undefined,
}: CompressionOptions): CompressionProvider {
  const factories = new Map<string, () => Duplex>();

  if (createZstd) factories.set('zstd', createZstd);
  if (createBrotli) factories.set('brotli', createBrotli);
  if (createDeflate) factories.set('deflate', createDeflate);
  if (createGzip) factories.set('gzip', createGzip);

  const encodings = [...factories.keys()];

  return {
    resolve: (response: ServerResponse): Compression | undefined => {
      const cacheControl = response.req.headers[HEADER_CACHE_CONTROL];

      // Cache control doesn't allow compression.
      if (cacheControl && /(?:^|,)\s*no-transform\s*(?:,|$)/u.test(cacheControl)) return;
      // Already encoded.
      if (response.hasHeader(HEADER_CONTENT_ENCODING)) return;
      // Too small to benefit from compression.
      if (getContentLength(response) < minimumBytes) return;

      const contentType = response.getHeader(HEADER_CONTENT_TYPE);
      const isCompressible = typeof contentType === 'string'
        ? compressible(contentType.split(';')[0]!.trim().toLowerCase()) ?? true
        : true;

      if (!isCompressible) return;

      const negotiator = new Negotiator(response.req);
      const encoding = (negotiator.encoding as (
        (contentEncodings?: string[], options?: { preferred?: string[] }) => string | undefined)
      )(encodings, { preferred: encodings });

      // Negotiation failed to find a supported compression.
      if (!encoding) return;
      // Filter prevents compression.
      if (!filter(response)) return;

      const createStream = factories.get(encoding)!;

      return { createStream, encoding };
    },
  };
}

function getContentLength(response: ServerResponse): number {
  const value = response.getHeader(HEADER_CONTENT_LENGTH);
  if (typeof value === 'string') return Number.parseInt(value, 10);
  if (typeof value === 'number') return value;
  return Number.NaN;
}
