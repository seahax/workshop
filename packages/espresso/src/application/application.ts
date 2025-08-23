import assert from 'node:assert';
import EventEmitter from 'node:events';
import { createServer, type RequestListener, type Server, type ServerOptions } from 'node:http';
import type { AddressInfo } from 'node:net';

import type { ErrorHandler } from '../error/error-handler.ts';
import { type Filter } from '../filter/filter.ts';
import { convertMiddleware } from '../middleware/convert-middleware.ts';
import { type ErrorMiddleware, type NextMiddleware, type SimpleMiddleware } from '../middleware/middleware.ts';
import { parseJson } from '../parser/parse-json.ts';
import { parseText } from '../parser/parse-text.ts';
import { parseUrlEncoded } from '../parser/parse-url-encoded.ts';
import type { Parser } from '../parser/parser.ts';
import type { ParserContentType } from '../parser/parser-content-type.ts';
import { type CompressionProvider, createCompressionProvider } from '../response/compression.ts';
import type { CompressionOptions, HeadersInit } from '../response/options.ts';
import { createRoute, type Route, type RouteHandler } from '../route/route.ts';
import { createRouter } from '../route/router.ts';
import { type Controller } from './controller.ts';
import { createListener } from './listener.ts';

interface Events {
  listening: [url: string, server: ServerLike];
  closing: [];
  close: [];
}

interface ServerLike {
  readonly listening: boolean;
  readonly keepAliveTimeout: number;
  readonly setSecureContext?: unknown;
  listen(port?: number, hostname?: string, backlog?: number, onListening?: () => void): unknown;
  on(event: 'request', listener: RequestListener): unknown;
  on(event: 'close', listener: () => void): unknown;
  address(): string | AddressInfo | null;
  close(): unknown;
  closeAllConnections(): unknown;
}

export interface Application extends EventEmitter<Events> {
  /**
   * Add a route.
   *
   * The single most specific route that matches a request is applied.
   */
  addRoute(route: Route): this;
  /**
   * Add a route defined inline.
   *
   * The single most specific route that matches a request is applied.
   */
  addRoute<TMethod extends string, TPathTemplate extends string>(
    method: TMethod | readonly TMethod[],
    path: TPathTemplate | readonly TPathTemplate[],
    handler: RouteHandler<TPathTemplate>,
  ): this;

  /**
   * Add a controller.
   */
  addController(controller: Controller): this;

  /**
   * Add a content type body parser.
   *
   * Content types must be media types such as `application/json`, _without_
   * wildcards (eg. `text/*`) or parameters (e.g. `text/plain; charset=utf-8`).
   */
  addParser(contentType: ParserContentType | readonly ParserContentType[], parser: Parser | false): this;

  /**
   * Add a filter.
   *
   * Filters are applied in the order they were added. If a filter sends a
   * response (ie. causes the response headers to be written), then all
   * remaining filters and the route will be skipped.
   */
  addFilter(filter: Filter): this;

  /**
   * Add an error handler.
   *
   * Error handlers are called when an error is thrown by a filter or route.
   * All error handler are called, in the order they were added. If an error
   * handler throws another error, subsequent error handlers will receive the
   * new error.
   */
  addErrorHandler(handler: ErrorHandler): this;

  /**
   * Add Connect-style middleware.
   *
   * NOTE: If an error occurs, _ALL_ error middleware functions will be called,
   * regardless of the order in which they were added. This is different from
   * the Express defined behavior, where only the error middleware added after
   * the middleware that threw the error, is invoked.
   */
  addMiddleware(middleware: SimpleMiddleware): this;
  addMiddleware(middleware: NextMiddleware): this;
  addMiddleware(middleware: ErrorMiddleware): this;

  /**
   * Add a default request handler that will handle all requests that are not
   * handled by a filter or a route. This includes requests that match a route,
   * where the route doesn't send a response.
   *
   * If the response is still unhandled after all default handlers are called,
   * then the application will send a `404 Not Found` response.
   */
  addDefaultHandler(handler: Filter): this;

  /**
   * Begin listening and handling requests.
   *
   * If the `server` option is omitted, a new HTTP (version 1) server is
   * created automatically.
   */
  listen(options?: ListenOptions): Server;
  listen<TServer extends ServerLike>(options?: ListenWithServerOptions<TServer>): TServer;

  /**
   * Close all of the application's listeners (aka. servers). Calling the
   * `listen` method will throw an error after calling this method.
   */
  close(): void;
}

export interface ApplicationOptions {
  readonly headers?: HeadersInit;
  readonly compression?: boolean | CompressionOptions | CompressionProvider;
}

export interface ListenWithServerOptions<TServer extends ServerLike> {
  readonly server: TServer;
  readonly port?: number;
  readonly hostname?: string;
  readonly backlog?: number;
  readonly closeOnSignal?: boolean | NodeJS.Signals | readonly NodeJS.Signals[];
  readonly onListening?: (url: string, server: TServer) => void;
}

export interface ListenOptions extends ServerOptions {
  readonly port?: number;
  readonly hostname?: string;
  readonly backlog?: number;
  readonly onListening?: (url: string, server: Server) => void;
}

/**
 * Create an Espresso application.
 *
 * An application is a Node HTTP server request listener with routing,
 * filtering, and error handling.
 */
export function createApplication({ headers, compression = true }: ApplicationOptions = {}): Application {
  let closed = false;

  const servers: ServerLike[] = [];
  const router = createRouter<Route>();
  const parsers = new Map<string, Parser>();
  const filters: Filter[] = [];
  const errorHandlers: ErrorHandler[] = [];
  const defaultHandlers: Filter[] = [];
  const compressionProvider: CompressionProvider | undefined = compression
    ? (typeof compression === 'object' && 'resolve' in compression
        ? compression
        : createCompressionProvider(compression === true ? {} : compression))
    : undefined;

  const self: Application = Object.assign<EventEmitter<Events>, Omit<Application, keyof EventEmitter>>(
    new EventEmitter(),
    {
      addRoute: (...args: [Route] | Parameters<typeof createRoute>) => {
        const route = args.length === 1 ? args[0] : createRoute(...args);

        route.methods.forEach((method) => {
          route.paths.forEach((path) => {
            router.addRoute(method, path, route);
          });
        });

        return self;
      },
      addController: (controller) => {
        controller.routes.forEach((route) => self.addRoute(route));
        return self;
      },
      addParser: (contentType, parser) => {
        (Array.isArray(contentType) ? contentType : [contentType]).forEach((value) => {
          if (parser === false) {
            parsers.delete(value.toLowerCase());
          }
          else {
            parsers.set(value.toLowerCase(), parser);
          }
        });

        return self;
      },
      addFilter: (filter) => {
        filters.push(filter);
        return self;
      },
      addErrorHandler: (errorHandler) => {
        errorHandlers.push(errorHandler);
        return self;
      },
      addMiddleware: (middleware) => {
        const [type, handler] = convertMiddleware(middleware);

        if (type === 'filter') {
          self.addFilter(handler);
        }
        else {
          self.addErrorHandler(handler);
        }

        return self;
      },
      addDefaultHandler: (handler) => {
        defaultHandlers.push(handler);
        return self;
      },
      listen: ({
        port,
        hostname,
        backlog,
        onListening,
        ...options
      }: ListenOptions | ListenWithServerOptions<ServerLike> = {}) => {
        assert.ok(!closed, 'Application is closed');

        const server = 'server' in options ? options.server : createServer(options);
        const listener = createListener({
          defaultHeaders: headers,
          router,
          compressionProvider,
          parsers,
          filters,
          errorHandlers,
          defaultHandlers,
        });

        server.listen(port, hostname, backlog, () => {
          const address = server.address() as AddressInfo;
          const hostname = address.family === 'IPv6' ? `[${address.address}]` : address.address;
          const protocol = 'setSecureContext' in server ? 'https' : 'http';
          const url = `${protocol}://${hostname}:${address.port}`;
          onListening?.(url, server as any);
          self.emit('listening', url, server);
        });
        server.on('request', listener);
        servers.push(server);

        return server as any;
      },

      close: () => {
        if (closed) return;

        closed = true;

        servers.forEach((server) => {
          server.close();
          setTimeout(() => server.closeAllConnections?.(), server.keepAliveTimeout + 5000).unref();
        });

        self.emit('closing');

        void Promise.all(servers.map((server) => {
          return server.listening ? new Promise<void>((resolve) => server.on('close', resolve)) : undefined;
        })).then(() => {
          self.emit('close');
        });
      },
    },
  );

  // Add default parsers.
  self.addParser(['application/json', 'default'], parseJson);
  self.addParser('application/x-www-form-urlencoded', parseUrlEncoded);
  self.addParser('text/plain', parseText);

  return self;
}
