import { applyErrorHandlers } from '../error/apply-error-handlers.ts';
import { ControllerError } from '../error/controller-error.ts';
import type { ErrorHandler } from '../error/error-handler.ts';
import { applyFilters } from '../filter/apply-filters.ts';
import type { Filter } from '../filter/filter.ts';
import { createRoute, type Route, type RouteHandler } from '../route/route.ts';

/**
 * A collection of routes, filters, and error handlers.
 *
 * Unlike in an `Application`, the filters and error handlers _only_ apply to
 * the routes defined within the controller, and only when those routes are
 * matched.
 */
export interface Controller {
  readonly routes: readonly Route[];

  /**
   * Add a predefined route.
   *
   * The single most specific route that matches a request is applied.
   */
  addRoute(route: Route): this;
  /**
   * Create and add a new route.
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
   * Add a filter.
   *
   * Filters are applied in the order they were added. If a filter sends a
   * response (ie. causes the response headers to be written), then all
   * remaining filters and the route will be skipped.
   *
   * Unlike application filters, controller filters are only applied if a
   * controller route is matched.
   */
  addFilter(filter: Filter): this;

  /**
   * Add an error handler.
   *
   * Error handlers are called when an error is thrown by a filter or route.
   * All error handler are called, in the order they were added. If an error
   * handler throws another error, subsequent error handlers will receive the
   * new error.
   *
   * Unlike application error handlers, controller error handlers are only
   * applied if a controller filter or route handler throws an error.
   */
  addErrorHandler(errorHandler: ErrorHandler): this;
}

/**
 * Create an Espresso controller.
 *
 * Controllers are used to group related routes, filters, and error handlers.
 * Unlike applications, the filters and error handlers are only applied when a
 * controller route is matched.
 */
export function createController(prefix?: string): Controller {
  if (!prefix?.startsWith('/')) prefix = `/${prefix}`;

  const routes: Route[] = [];
  const filters: Filter[] = [];
  const errorHandlers: ErrorHandler[] = [];
  const self: Controller = {
    get routes() {
      return routes;
    },

    addRoute(...args: [Route] | Parameters<typeof createRoute>) {
      const { methods, paths, handler } = args.length === 1 ? args[0] : createRoute(...args);
      const prefixedPaths = paths.map((path) => `${prefix}${path.startsWith('/') ? path : `/${path}`}`);
      const route = createRoute(methods, prefixedPaths, async (request, response) => {
        try {
          await applyFilters(filters, request, response);
          if (response.sent) return;

          await handler(request, response);
        }
        catch (error: unknown) {
          const result = await applyErrorHandlers(errorHandlers, error, request, response);

          if (!result.stopped) {
            // If none of the error handlers stopped the error from
            // propagating, re-throw the last error so that it can be handled
            // by the application (or parent controller).
            // eslint-disable-next-line @typescript-eslint/only-throw-error
            throw new ControllerError(result.error, result.handled);
          }
        }
      });

      routes.push(route);
      return this;
    },

    addController(controller) {
      controller.routes.forEach((route) => this.addRoute(route));
      return this;
    },

    addFilter(filter) {
      filters.push(filter);
      return this;
    },

    addErrorHandler(errorHandler) {
      errorHandlers.push(errorHandler);
      return this;
    },
  };

  return self;
}
