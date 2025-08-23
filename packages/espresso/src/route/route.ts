import type { Request } from '../request/request.ts';
import type { Response } from '../response/response.ts';
import type { PathParameters } from './path.ts';

/**
 * Represents how an HTTP method and path(s) should be handled.
 */
export interface Route {
  /**
   * The methods that the route matches.
   */
  readonly methods: readonly string[];

  /**
   * The path templates that the route matches.
   */
  readonly paths: readonly string[];

  /**
   * The function that handles requests matching any of the endpoints.
   */
  readonly handler: (
    request: Request<{}>,
    response: Response,
  ) => Promise<void>;
}

/**
 * Handle a request and return a response.
 */
export type RouteHandler<TPathTemplate extends string> = (
  request: Request<PathParameters<TPathTemplate>>,
  response: Response,
) => void | Promise<void>;

/**
 * Create a route.
 *
 * A route is a collection of endpoint definitions (methods and path
 * templates), and the handler that should be called if any of those endpoints
 * match a request.
 */
export function createRoute<TMethod extends string, TPathTemplate extends string>(
  methods: TMethod | readonly TMethod[],
  paths: TPathTemplate | readonly TPathTemplate[],
  handler: RouteHandler<TPathTemplate>,
): Route {
  return {
    methods: (Array.isArray(methods) ? [...methods] : [methods]),
    paths: (Array.isArray(paths) ? [...paths] : [paths]),
    handler: async (request, response) => {
      await handler(request, response);
    },
  };
}
