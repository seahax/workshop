import type { PathParameters } from './path.ts';
import type { Request } from './request.ts';
import { type ServiceInstances, type ServiceProvider } from './service.ts';

type FilterFunction = (context: Request) => Promise<undefined | Response | FilterResponseHandler>;

interface FilterProps {
  /**
   * The services that the filter will use.
   */
  readonly services: readonly ServiceProvider<any>[];
}

export type Filter = FilterFunction & FilterProps;

/**
 * Configuration for creating a filter.
 */
export interface FilterConfiguration<TPathTemplate extends string, TServices extends readonly ServiceProvider<any>[]> {
  /**
   * The path template that the route matches against.
   */
  readonly path?: TPathTemplate | readonly TPathTemplate[];

  /**
   * The services that the route will use.
   */
  readonly use?: TServices;
}

/**
 * Filter a request, optionally returning a response to handle the request
 * early.
 */
export type FilterHandler<TPathTemplate extends string, TServices extends readonly ServiceProvider<any>[]> = (
  context: FilterContext<TPathTemplate>,
  ...services: ServiceInstances<TServices>
) => undefined | Response | FilterResponseHandler | Promise<undefined | Response | FilterResponseHandler>;

export type FilterResponseHandler = (response: Response) => void | Promise<void>;

export interface FilterContext<TPathTemplate extends string> {
  readonly request: Request;
  readonly pathParameters: PathParameters<TPathTemplate>;
}

export function createFilter(handler: FilterHandler<string, readonly ServiceProvider<any>[]>): Filter;
export function createFilter<
  TPathTemplate extends string,
  const TServices extends readonly ServiceProvider<any>[],
>(
  config: FilterConfiguration<TPathTemplate, TServices>,
  handler: FilterHandler<TPathTemplate, TServices>
): Filter;
export function createFilter(...args: (
  | [handler: FilterHandler<string, readonly ServiceProvider<any>[]>]
  | [
    config: FilterConfiguration<string, readonly ServiceProvider<any>[]>,
    handler: FilterHandler<string, readonly ServiceProvider<any>[]>,
  ]
)): Filter {
  const [config, handler] = args.length === 2 ? args : [{}, args[0]];
  const { path = [], use: services = [] } = config;
  const pathTemplates = Array.isArray(path) ? path : [path];

  return Object.assign<FilterFunction, FilterProps>((request) => {
    // TODO: Implement filters.
    throw new Error('Not implemented');
  }, {
    services,
  });
}

// DEMO

// const myService = createServiceProvider({
//   name: 'my-service',
//   scope: 'request',
// }, () => {
//   return 'MyService' as const;
// });

// const filter0 = createFilter({
//   path: '/foo/{bar}',
//   use: [myService],
// }, ({ request, pathParameters }, myService) => {
//   void request;
//   void pathParameters;
//   void myService;
//   throw new Error('Not implemented');
// });

// const filter1 = createFilter(({ request, pathParameters }) => {
//   void request;
//   void pathParameters;
//   throw new Error('Not implemented');
// });

// void filter0;
// void filter1;
