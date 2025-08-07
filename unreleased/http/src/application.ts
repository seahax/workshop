import {
  createServer as createHttpServer,
  type IncomingMessage,
  type Server as HttpServer,
  type ServerOptions as HttpServerOptions,
  type ServerResponse,
} from 'node:http';
import {
  createServer as createHttpsServer,
  type Server as HttpsServer,
  type ServerOptions as HttpsServerOptions,
} from 'node:https';
import type { Socket } from 'node:net';
import { type Duplex, EventEmitter } from 'node:stream';

import type { Filter } from './filter.ts';
import { createRequest, RequestValidationError } from './request.ts';
import { type Response, response, sendResponse } from './response.ts';
import type { Route } from './route.ts';
import { createRouter } from './router.ts';
import type { ServiceProvider } from './service.ts';

interface Events {
  serverListening: [server: WithApplication<HttpServer> | WithApplication<HttpsServer>];
  serverError: [error: Error, server: WithApplication<HttpServer> | WithApplication<HttpsServer>];
  serverClose: [server: WithApplication<HttpServer> | WithApplication<HttpsServer>];
  serviceError: [error: Error];
  closeRequested: [{ readonly force: boolean }];
  close: [];
}

interface ApplicationProperties {
  /**
   * Start a new NodeJS HTTP/1.x server to listen for incoming requests.
   */
  listen(options?: ApplicationListenOptions): WithApplication<HttpServer>;

  /**
   * Start a new NodeJS secure (TLS) HTTP/1.x server to listen for incoming
   * requests.
   */
  listenSecure(options?: ApplicationListenSecureOptions): WithApplication<HttpsServer>;

  /**
   * Listen for incoming requests on an existing server.
   */
  listenExisting<TServer extends HttpServer | HttpsServer>(server: TServer): WithApplication<TServer>;

  /**
   * Get all of the services (recursive) used by all of the application routes.
   */
  getServices(): ServiceProvider<any>[];

  /**
   * Get all of servers that the application is listening on. If a server is
   * closed, it will be removed from this list.
   */
  getServers(): (WithApplication<HttpServer> | WithApplication<HttpsServer>)[];

  /**
   * Get all of the sockets that the application has opened. If a socket is
   *  closed, it will be removed from this list.
   */
  getSockets(): (Duplex | Socket)[];

  /**
   * Request that the application close. This will call the `close` method on
   * all of the servers that the application is listening on. When all of the
   * servers are closed, the application will emit a `close` event.
   *
   * New servers can be added after this method is called, but before all the
   * previous servers have closed. The new servers will not be closed and the
   * `close` event will not be emitted, effectively prevent the application
   * from closing until this method is called again to close the new servers.
   */
  close(): void;
}

/**
 * _Using a single application per NodeJS application is recommended, because
 * it makes `application` scoped services singletons._
 *
 * An application uses routes and filters to listen on NodeJS HTTP(S) servers
 * and respond to requests. It also hosts lifecycle and error events.
 */
export interface Application extends EventEmitter<Events>, ApplicationProperties {}

/**
 * An object that has an `application` property.
 */
export type WithApplication<TObject extends object> = (
  TObject & { readonly application: Application }
);

/**
 * Route and optionally filters that the application will use to serve
 * requests.
 */
export interface ApplicationConfiguration {
  readonly filters?: readonly Filter[];
  readonly routes: readonly Route[];
}

/**
 * Routes that the application will use to serve requests.
 */
type ApplicationRoutes = Route[];

/**
 * Options for creating listening.
 */
export interface ApplicationListenOptions extends HttpServerOptions {
  /**
   * Port to listen on. Defaults to `0`, which means the OS will assign a
   * random unused port.
   */
  readonly port?: number;

  /**
   * The host name or IP address to listen on. Defaults to `127.0.0.1`.
   */
  readonly hostname?: string;

  /**
   * Maximum size of the servers pending connection queue. Defaults to `511`.
   * Large values may be capped by the operating system.
   */
  readonly backlog?: number;
};

/**
 * Options for starting HTTPS servers.
 */
export type ApplicationListenSecureOptions = (
  ApplicationListenOptions & Omit<HttpsServerOptions, keyof HttpServerOptions>
);

/**
 * An application is a collection of routes and filters that can be used to
 * serve HTTP requests.
 *
 * Use the `listen`, `listenSecure`, or `listenExternal` methods to start
 * serving requests.
 */
export function createApplication(configurationOrRoutes: ApplicationConfiguration | ApplicationRoutes): Application {
  let abortController = new AbortController();

  const configuration = Array.isArray(configurationOrRoutes)
    ? { filters: [], routes: configurationOrRoutes }
    : configurationOrRoutes;
  const router = createRouter<Route>();
  const services = new Set<ServiceProvider<any>>();
  const servers = new Set<WithApplication<HttpServer> | WithApplication<HttpsServer>>();
  const sockets = new Set<Duplex | Socket>();

  configuration.routes.forEach((route) => {
    router.add(route);

    // Capture all new unique services that are used by the route.
    route.services.forEach(function addService(service) {
      if (!services.has(service)) {
        services.add(service);
        service.services.forEach((service) => addService(service));
      }
    });
  });

  /**
   * Get a NodeJS HTTP `Server` listener bound to a specific server.
   */
  const getListener = (server: WithApplication<HttpServer> | WithApplication<HttpsServer>) => (
    $request: IncomingMessage,
    $response: ServerResponse,
  ): void => {
    const match = router.match($request.method, $request.url);
    const pathParameters = match.type === 'found' ? match.pathParameters : {};
    const request = createRequest({ $request, $response, server, signal: abortController.signal });

    void (async () => {
      let result: Response | Error | undefined;

      // // Process "before response" filter handlers.
      // for (const beforeResponseHandler of beforeResponseHandlers) {
      //   result = await tryHandler(beforeResponseHandler, request);

      //   if (result) {
      //     // Response or Error returned. Stop processing "before response"
      //     // handlers.
      //     break;
      //   }
      // }

      if (!result) {
        // No result from a filter.

        if (match.type === 'found') {
          // Request matched a route.

          try {
            result = await match.route({ request, pathParameters });
          }
          catch (error) {
            result = error instanceof Error
              ? error
              : new Error('Route handler failed', { cause: error });
          }
        }
        else if (match.type === 'path-found') {
          result = response.json(
            { error: 'Method Not Allowed' },
            { status: 405 },
          );
        }
        else {
          result = response.json(
            { error: 'Not Found' },
            { status: 404 },
          );
        }
      }

      // // Process "after response" filter handlers.
      // for (const afterResponseHandler of afterResponseHandlers) {
      //   // If the handler returns a new result, it becomes the input result for
      //   // the next handler. If the handler does not return a new result, the
      //   // current result is persisted as the input result for the next
      //   // handler.
      //   result = await tryHandler(afterResponseHandler, request, result) ?? result;
      // }

      if (result instanceof RequestValidationError) {
        // Validation failed, and the error was not handled. Use a default 400
        // response.
        result = response.json(
          { error: 'Bad Request', issues: result.issues },
          { status: 400 },
        );
      }
      else if (result instanceof Error) {
        // Something other than validation failed, and the error was not
        // handled. Use a default 500 response.
        result = response.json(
          { error: 'Internal Server Error' },
          { status: 500 },
        );
      }

      sendResponse($response, result, {
        sendBody: $request.method?.toUpperCase() !== 'HEAD',
      });
    })();
  };

  const self: Application = Object.assign<ApplicationEventEmitter, ApplicationProperties>(
    new ApplicationEventEmitter(),
    {
      getServices() {
        return Array.from(services);
      },
      getServers() {
        return Array.from(servers);
      },
      getSockets() {
        return Array.from(sockets);
      },
      listen({ port = 0, hostname = '127.0.0.1', backlog, ...options } = {}) {
        return self.listenExisting(createHttpServer({ keepAlive: true, ...options }).listen(port, hostname, backlog));
      },
      listenSecure({ port = 0, hostname = '127.0.0.1', backlog, ...options } = {}) {
        return self.listenExisting(createHttpsServer({ keepAlive: true, ...options }).listen(port, hostname, backlog));
      },
      listenExisting<TServer extends HttpServer | HttpsServer>(nodeServer: TServer) {
        if (servers.has(nodeServer as WithApplication<TServer>)) {
          // Server already used by this application.
          return nodeServer as WithApplication<TServer>;
        }

        if ('application' in nodeServer) {
          throw new Error('Server already used by another application.');
        }

        const server = Object.assign(nodeServer, { application: self }) as WithApplication<TServer>;

        servers.add(server);
        services.forEach((service) => service.initialize(server));

        if (server.listening) {
          self.emit('serverListening', server);
        }
        else {
          server.on('listening', () => self.emit('serverListening', server));
        }

        server.on('error', (error) => self.emit('serverError', error, server));
        server.on('request', getListener(server));
        server.on('connection', (streamOrSocket: Duplex | Socket) => {
          if (!streamOrSocket.closed) {
            sockets.add(streamOrSocket);
            streamOrSocket.on('close', () => sockets.delete(streamOrSocket));
          }
        });
        server.on('close', () => {
          servers.delete(server);
          self.emit('serverClose', server);
        });

        return server;
      },
      close({ force = false }: { readonly force?: boolean } = {}) {
        self.emit('closeRequested', { force });

        servers.forEach((server) => {
          server.close();

          if (force) {
            server.closeAllConnections();
            sockets.forEach((socket) => socket.destroy());
          }
          else {
            server.closeIdleConnections();
          }
        });

        abortController.abort();
        abortController = new AbortController();
      },
    },
  );

  process.on('SIGINT', () => self.close());

  return self;
}

/**
 * A modified event emitter that logs application `*Error` events if they are
 * not handled.
 */
class ApplicationEventEmitter extends EventEmitter<Events> {
  override emit<TEvent>(
    event: keyof Events | TEvent,
    ...args: TEvent extends keyof Events ? Events[TEvent] : never
  ): boolean {
    if (super.emit(event, ...args)) {
      return true;
    }

    if (typeof event === 'string' && event.endsWith('Error')) {
      // Log errors that are not handled.
      console.error(...args);
      return true;
    }

    return false;
  }
}
