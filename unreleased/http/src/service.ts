import type { Server as HttpServer } from 'node:http';
import type { Server as HttpsServer } from 'node:https';

import { type Application, type WithApplication } from './application.ts';
import type { Request } from './request.ts';

type Context<TScope extends ServiceScope> = (
  TScope extends 'application' ? Application
    : TScope extends 'server' ? WithApplication<HttpServer> | WithApplication<HttpsServer>
      : TScope extends 'request' ? Request
        : never
);

/**
 * Services are scoped factories (aka: providers, constructors) with optional
 * post creation hooks and health checks.
 */
export interface ServiceProvider<TInstance extends {}> {
  /**
   * Service identifier, used in errors, metrics, logging, and health checks.
   */
  readonly name: string;

  /**
   * When service instances will be created.
   *
   * - `application`: Once per application.
   * - `server`: Once per server.
   * - `request`: Once per request.
   */
  readonly scope: ServiceScope;

  /**
   * Other services that this service depends on.
   */
  readonly services: readonly ServiceProvider<any>[];

  /**
   * Health check status. Will be `null` until the first health check is
   * performed, then it will be the most recent value returned by the health
   * check function.
   */
  readonly healthy: null | boolean;

  /**
   * Initialize (pre-resolve) the service before it is used to handle requests.
   * This is a no-op for `request` scoped services.
   */
  initialize(server: WithApplication<HttpServer> | WithApplication<HttpsServer>): void;

  /**
   * Get the service instance associated with the request, creating a new
   * instance if necessary.
   */
  resolve(request: Request): TInstance;
}

/**
 * Configuration for creating a service.
 */
export interface ServiceProviderConfiguration<
  TScope extends ServiceScope,
  TServices extends readonly ServiceProvider<any>[],
> {
  /**
   * Service identifier, used in errors, metrics, logging, and health checks.
   */
  readonly name: string;

  /**
   * When service instances will be created.
   *
   * - `application`: Once per application.
   * - `server`: Once per server.
   * - `request`: Once per request.
   */
  readonly scope: TScope;

  /**
   * Other services that the service depends on.
   */
  readonly use?: TServices;
}

/**
 * Factory function for creating a service instance.
 */
export type ServiceFactory<
  TScope extends ServiceScope,
  TServices extends readonly ServiceProvider<any>[],
  TInstance,
> = (
  context: Context<TScope>,
  ...serviceInstances: ServiceInstances<TServices>
) => TInstance;

/**
 * Callback function to perform asynchronous post-creation tasks for a service
 * instance.
 */
export type ServicePostCreate<
  TScope extends ServiceScope,
  TServices extends readonly ServiceProvider<any>[],
  TInstance,
> = (
  instance: TInstance,
  context: Context<TScope>,
  ...serviceInstances: ServiceInstances<TServices>
) => (
  | (TScope extends 'application' ? void | ServicePostCreateConfig : void)
  | Promise<TScope extends 'application' ? void | ServicePostCreateConfig : void>
);

/**
 * Configuration for a service health check.
 */
export interface ServicePostCreateConfig {
  /**
   * Number of seconds to wait before running the first health check. Defaults
   * to `0` seconds.
   */
  readonly healthCheckDelaySeconds?: number;

  /**
   * Interval in seconds between health checks. A health check will be skipped
   * if a previous health check is still running. Defaults to `60` seconds.
   */
  readonly healthCheckIntervalSeconds?: number;

  /**
   * An optional signal which will prevent any future health checks from
   * running once it is aborted.
   */
  readonly healthCheckSignal?: AbortSignal;

  /**
   * Checks the service health.
   *
   * If the function returns `true`, the service is considered healthy. If it
   * returns `false`, the service is considered unhealthy. If it throws an
   * error, the service is considered unhealthy and the error will be emitted
   * on the `application` as a `serviceError` event.
   */
  readonly healthCheck?: () => boolean | Promise<boolean>;
}

/**
 * Utility that converts a tuple of services into a tuple of their instance
 * types.
 */
export type ServiceInstances<TServices> = (
  TServices extends readonly [infer TFirst, ...infer TRest]
    ? [TFirst extends ServiceProvider<infer TValue> ? TValue : unknown, ...ServiceInstances<TRest>]
    : []
);

/**
 * Service scope types.
 */
export type ServiceScope = 'application' | 'server' | 'request';

/**
 * Create a service _definition_ (not an instance). Instances are created when
 * the `getInstance` method is called with a context.
 */
export function createServiceProvider<
  TScope extends ServiceScope,
  const TInstance extends {},
  const TServices extends readonly ServiceProvider<any>[] = [],
>(
  {
    name,
    scope,
    use = [] as readonly ServiceProvider<any>[] as TServices,
  }: ServiceProviderConfiguration<TScope, TServices>,
  create: ServiceFactory<TScope, TServices, TInstance>,
  postCreate?: ServicePostCreate<TScope, TServices, NoInfer<TInstance>>,
): ServiceProvider<TInstance> {
  /** Guard against circular dependencies. */
  let resolving = false;
  let healthy: null | boolean = null;

  const cache = new WeakMap<
    Application | WithApplication<HttpServer> | WithApplication<HttpsServer> | Request,
    { readonly value: TInstance }
  >();

  function resolve(request: Request): TInstance;
  function resolve(server: WithApplication<HttpServer> | WithApplication<HttpsServer>): TInstance | undefined;
  function resolve(
    baseContext: Request | WithApplication<HttpServer> | WithApplication<HttpsServer>,
  ): TInstance | undefined {
    if (resolving) {
      throw new Error(`Service "${name}" circularly depends on itself.`);
    }

    resolving = true;

    try {
      const application = getContext('application', baseContext);
      const context = getContext(scope, baseContext);

      if (!context) {
        // The service is request scoped, and base context is a server, so the
        // service is not resolvable. Only service and application scoped
        // services are resolvable given a service base context.
        return;
      }

      const cached = cache.get(context);

      if (cached) {
        return cached.value;
      }

      const serviceInstances = use.map((service) => service.resolve(context as any));
      const instance = create(context, ...serviceInstances as ServiceInstances<TServices>);
      cache.set(context, { value: instance });

      (async () => {
        const {
          healthCheck,
          healthCheckDelaySeconds = 0,
          healthCheckIntervalSeconds = 60,
          healthCheckSignal,
        }: ServicePostCreateConfig = (
          await postCreate?.(instance, context, ...serviceInstances as ServiceInstances<TServices>)
        ) ?? {};

        if (scope !== 'application' || !healthCheck || healthCheckSignal?.aborted) {
          // No health check, so just return without scheduling.
          return;
        }

        let checking = false;
        let checkInterval: NodeJS.Timeout | undefined;

        const checkTimeout = setTimeout(() => {
          checkInterval = setInterval(() => {
            void Promise.resolve()
              .then(async () => {
                if (checking) {
                  // Skip this health check if a previous one is still running.
                  return;
                }

                checking = true;
                healthy = await healthCheck();
              })
              .catch((error: unknown) => {
                healthy = false;
                application.emit('serviceError', error instanceof Error
                  ? error
                  : new Error(`Service "${name}" health check failed.`, { cause: error }));
              })
              .finally(() => {
                checking = false;
              });
          }, healthCheckIntervalSeconds * 1000);
        }, healthCheckDelaySeconds * 1000);

        healthCheckSignal?.addEventListener('abort', () => {
          clearTimeout(checkTimeout);
          clearInterval(checkInterval);
        });
      })().catch((error: unknown) => {
        application.emit('serviceError', error instanceof Error
          ? error
          : new Error(`Service "${name}" post create failed.`, { cause: error }));
      });

      return instance;
    }
    finally {
      resolving = false;
    }
  }

  return {
    name,
    scope,
    services: use,
    get healthy() {
      return healthy;
    },
    initialize(server) {
      // Resolve the service without consuming it. This will invoke the factory
      // for server and application scoped services early. This prevents
      // construction from increasing request time, and gives the post-creation
      // callback a chance to run before the service is used.
      resolve(server);
    },
    resolve(request) {
      return resolve(request);
    },
  };
}

export function resolveServicesTuple<TServices extends readonly ServiceProvider<any>[]>(
  request: Request,
  services: TServices,
): ServiceInstances<TServices> {
  // Map doesn't handle tuple types well, so we have to assert that mapping
  // the service tuple to the service instances tuple is safe.
  return services.map((service) => service.resolve(request)) as ServiceInstances<TServices>;
}

/**
 * Take the scope type and a base context, and return the specific context type
 * for the scope, derived from the base context.
 *
 * The base context must be the context for an equal or more specific scope
 * (eg. a server can be used to get an application, but not a request).
 */
function getContext(
  scope: 'application',
  baseContext: WithApplication<HttpServer> | WithApplication<HttpsServer> | Request,
): Context<'application'>;
function getContext<TScope extends ServiceScope>(
  scope: TScope,
  baseContext: WithApplication<HttpServer> | WithApplication<HttpsServer> | Request,
): Context<TScope> | undefined;
function getContext<TScope extends ServiceScope>(
  scope: TScope,
  baseContext: WithApplication<HttpServer> | WithApplication<HttpsServer> | Request,
): Context<TScope> | undefined {
  switch (scope) {
    case 'application': {
      return 'url' in baseContext
        ? baseContext.server.application as Context<TScope>
        : baseContext.application as Context<TScope>;
    }
    case 'server': {
      return 'url' in baseContext
        ? baseContext.server as Context<TScope>
        : baseContext as Context<TScope>;
    }
    case 'request': {
      return 'url' in baseContext
        ? baseContext as Context<TScope>
        : undefined;
    }
  }
}
