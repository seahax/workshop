import { EventEmitter } from 'node:events';
import type { OutgoingHttpHeaders, ServerResponse } from 'node:http';

import { type CompressionProvider } from './compression.ts';
import type {
  BodyInit,
  HeadersInit,
  ResponseConfig,
  SendFileOptions,
  SendJsonOptions,
  SendOptions,
} from './options.ts';
import { send } from './send.ts';
import { sendFile } from './send-file.ts';
import { sendJson } from './send-json.ts';

interface Events {
  presend: [];
  send: [];
  prefinish: [];
  finish: [];
  end: [];
  close: [];
}

type HeaderMethods<TThis> = {
  [P in keyof ServerResponse as P extends (
    | 'hasHeader'
    | 'getHeader'
    | 'getHeaders'
    | 'getHeaderNames'
    | 'setHeader'
    | 'setHeaders'
    | 'appendHeader'
    | 'removeHeader'
  ) ? P : never]: (
    ServerResponse[P] extends (...args: infer A) => infer R
      ? (...args: A) => R extends ServerResponse ? TThis : R
      : never
  )
};

export class Response extends EventEmitter<Events> implements HeaderMethods<Response> {
  #sent = false;
  #compressionProvider: CompressionProvider | undefined;

  /**
   * @internal
   */
  readonly $response: ServerResponse;

  constructor({ response, headers, compressionProvider }: ResponseConfig) {
    super();
    this.#compressionProvider = compressionProvider;
    this.$response = response;

    if (headers) {
      response.setHeaders(new Headers(headers));
    }

    const _writeHead = response.writeHead.bind(response);

    response.writeHead = (...args: [any, ...any[]]) => {
      if (!response.headersSent) {
        this.emit('presend');
      }

      _writeHead(...args);
      this.emit('send');

      return response;
    };

    response.once('prefinish', () => this.emit('prefinish'));
    response.once('finish', () => this.emit('finish'));
    response.once('end', () => this.emit('end'));
    response.once('close', () => this.emit('close'));
  }

  /**
   * True if a `send*` method has been called, or if the underlying
   * `ServerResponse` headers have been sent (`response.headersSent` is true).
   */
  get sent(): boolean {
    return this.#sent || this.$response.headersSent;
  }

  /**
   * True if the response is finished (ie. the writable stream is ended).
   */
  get finished(): boolean {
    return this.$response.writableEnded;
  }

  get status(): number {
    return this.$response.statusCode;
  }

  setStatus(status: number): this {
    this.#assertNotSent();
    this.$response.statusCode = status;
    return this;
  }

  async send(body?: BodyInit, options?: SendOptions): Promise<void> {
    this.#assertNotSent();
    this.#sent = true;
    await send(this.$response, this.#compressionProvider, body, options);
  }

  async sendJson(body: unknown, options?: SendJsonOptions): Promise<void> {
    this.#assertNotSent();
    this.#sent = true;
    await sendJson(this.$response, this.#compressionProvider, body, options);
  }

  async sendFile(root: string, filename: string, options?: SendFileOptions): Promise<void> {
    this.#assertNotSent();
    this.#sent = true;
    await sendFile(this.$response, this.#compressionProvider, root, filename, options);
  }

  hasHeader(name: string): boolean {
    return this.$response.hasHeader(name);
  }

  getHeader(name: string): string | number | string[] | undefined {
    return this.$response.getHeader(name);
  }

  getHeaders(): OutgoingHttpHeaders {
    return this.$response.getHeaders();
  }

  getHeaderNames(): string[] {
    return this.$response.getHeaderNames();
  }

  setHeader(name: string, value: number | string | readonly string[]): this {
    this.#assertNotSent();
    this.$response.setHeader(name, value);
    return this;
  }

  setHeaders(headers: HeadersInit | Map<string, number | string | readonly string[]>): this {
    this.#assertNotSent();
    this.$response.setHeaders(headers instanceof Map ? headers : new Headers(headers));
    return this;
  }

  appendHeader(name: string, value: string | readonly string[]): this {
    this.#assertNotSent();
    this.$response.appendHeader(name, value);
    return this;
  }

  removeHeader(name: string): this {
    this.#assertNotSent();
    this.$response.removeHeader(name);
    return this;
  }

  #assertNotSent(): void {
    if (this.#sent) throw new Error('Response has already been sent');
  }
}

export function createResponse(config: ResponseConfig): Response {
  return new Response(config);
}
