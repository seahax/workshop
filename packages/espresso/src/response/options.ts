import type { ServerResponse } from 'node:http';
import type { Duplex, Readable } from 'node:stream';

import type { CompressionProvider } from './compression.ts';

export interface ResponseConfig extends Omit<SendOptions, 'status'> {
  readonly response: ServerResponse;
  readonly compressionProvider: CompressionProvider | undefined;
}

export interface SendOptions {
  readonly status?: number;
  readonly headers?: HeadersInit;
}

export interface SendJsonOptions extends SendOptions {
  readonly replacer?: (key: string, value: unknown) => unknown;
}

export interface SendFileOptions extends Omit<SendOptions, 'headers'> {
  readonly headers?: HeadersInit | ((filename: string) => HeadersInit);
  readonly onNotFound?: string | ((response: ServerResponse, root: string, filename: string) => void | Promise<void>);
  readonly useCacheControl?: boolean;
}

export type HeadersInit = ConstructorParameters<typeof Headers>[0];

export type BodyInit = (
  | string
  | URLSearchParams
  | ArrayBuffer
  | Iterable<Uint8Array>
  | AsyncIterable<Uint8Array>
  | Generator<Uint8Array, void, unknown>
  | AsyncGenerator<Uint8Array, void, unknown>
  | Readable
  | null
  | undefined
);

export interface CompressionOptions {
  readonly minimumBytes?: number;
  readonly filter?: (response: ServerResponse) => boolean;
  readonly createZstd?: () => Duplex;
  readonly createBrotli?: () => Duplex;
  readonly createDeflate?: () => Duplex;
  readonly createGzip?: () => Duplex;
}
