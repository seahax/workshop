import type { PathParameters } from './path.ts';
import type { Request } from './request.ts';
import { type Response } from './response.ts';
import { resolveServicesTuple, type ServiceInstances, type ServiceProvider } from './service.ts';

type RouteFunction = (context: RouteContext<string>) => Promise<Response>;

interface RouteProps {
  /**
   * Request method that the route matches against.
   */
  readonly method: string;

  /**
   * Request path template that the route matches against.
   */
  readonly pathTemplates: readonly string[];

  /**
   * The services that the route will use.
   */
  readonly services: readonly ServiceProvider<any>[];
}

/**
 * Represents how an HTTP method and path(s) should be handled.
 */
export type Route = RouteFunction & RouteProps;

/**
 * Configuration for creating a route.
 */
export interface RouteConfiguration<
  TMethod extends string,
  TPathTemplate extends string,
  TServices extends readonly ServiceProvider<any>[],
> {
  /**
   * The HTTP method that the route matches against.
   */
  readonly method: TMethod;

  /**
   * The path template that the route matches against.
   */
  readonly path: TPathTemplate | readonly TPathTemplate[];

  /**
   * The services that the route will use.
   */
  readonly use?: TServices;
}

/**
 * Handle a request and return a response.
 */
export type RouteHandler<TPathTemplate extends string, TServices extends readonly ServiceProvider<any>[]> = (
  context: RouteContext<TPathTemplate>,
  ...serviceInstances: ServiceInstances<TServices>
) => Response | Promise<Response>;

export interface RouteContext<TPathTemplate extends string> {
  readonly request: Request;
  readonly pathParameters: PathParameters<TPathTemplate>;
}

/**
 * Create a route.
 */
export function createRoute<
  TMethod extends string,
  TPathTemplate extends string,
  const TServices extends readonly ServiceProvider<any>[],
>(
  {
    method,
    path,
    use: services = [] as readonly ServiceProvider<any>[] as TServices,
  }: RouteConfiguration<TMethod, TPathTemplate, TServices>,
  handler: RouteHandler<TPathTemplate, TServices>,
): Route {
  const pathTemplates = Array.isArray(path) ? path : [path];

  return Object.assign<RouteFunction, RouteProps>(async (context) => {
    const serviceInstances = resolveServicesTuple(context.request, services);
    const response = await handler(context, ...serviceInstances);
    return response;
  }, {
    method,
    pathTemplates,
    services,
  });
}

// TODO: Websocket routes.

// DEMO

// // eslint-disable-next-line import/no-extraneous-dependencies
// import { z } from 'zod';

// import { response } from './response.ts';
// import { createServiceProvider } from './service.ts';

// const otherService = createServiceProvider({
//   name: 'other-service',
//   scope: 'server',
// }, (server) => {
//   void server;
//   return 'OtherService' as const;
// });

// const myService = createServiceProvider({
//   name: 'my-service',
//   scope: 'application',
//   use: [otherService],
// }, (application, otherService) => {
//   void application;
//   void otherService;
//   return 'MyService' as const;
// }, async (instance, application, otherService) => {
//   void instance;
//   void application;
//   void otherService;

//   return {
//     healthCheckDelaySeconds: 30,
//     healthCheckIntervalSeconds: 60,
//     healthCheck: async () => {
//       return true;
//     },
//   };
// });

// export const helloRoute = createRoute({
//   method: 'GET',
//   path: ['/hello/{who}', '/test/{who}'],
//   use: [myService, otherService],
// }, async ({ request, pathParameters }, myService, otherService) => {
//   void pathParameters;
//   const { who } = await request.validate(helloRouteParameters, () => ({
//     who: request.queryParameters.who,
//   }));

//   void myService;
//   void otherService;

//   return response.json({ hello: who });
// });

// const helloRouteParameters = z.object({
//   who: z.coerce.number(),
// });
