import { type IncomingHttpHeaders } from 'node:http';

import {
  type AppRoute,
  type AppRouter as AppRouterContract,
  isAppRoute,
  isAppRouteNoBody,
  isAppRouteOtherResponse,
  isZodType,
  type ParamsFromUrl,
  type ResolveResponseType,
  type ZodInferOrType,
  type ZodInputOrType,
} from '@ts-rest/core';
import type { NextFunction, Request, RequestHandler, Response, Router } from 'express';
import type { SafeParseReturnType, ZodError } from 'zod';

type WithDefault<A, B> = unknown extends A ? B : A;

export type TsRestResponseType<
  TStatus extends number,
  TRoute extends AppRoute,
> = ZodInputOrType<ResolveResponseType<TRoute['responses'][TStatus]>>;

export type TsRestResponse<
  TStatus extends number,
  TRoute extends AppRoute,
> = TsRestResponseType<TStatus, TRoute> extends undefined
  ? { status: TStatus; body?: TsRestResponseType<TStatus, TRoute> }
  : { status: TStatus; body: TsRestResponseType<TStatus, TRoute> };

export type TsRestResponses<TRoute extends AppRoute> = {
  [TStatus in keyof TRoute['responses']]: TStatus extends number ? TsRestResponse<TStatus, TRoute> : never;
}[keyof TRoute['responses']];

export interface TsRestExpressDefaultParams {
  [key: string]: string | undefined;
}

export interface TsRestExpressDefaultQuery {
  [key: string]: undefined | string | TsRestExpressDefaultQuery | (string | TsRestExpressDefaultQuery)[];
}

export interface TsRestRequest<TRoute extends AppRoute>
  extends Omit<Request<unknown, unknown, unknown, unknown>,
    | 'res'
    | 'next'
    | 'headers'
    | 'params'
    | 'query'
    | 'body'
  > {
  headers: WithDefault<ZodInferOrType<TRoute['headers']>, IncomingHttpHeaders>;
  params: WithDefault<ZodInferOrType<TRoute['pathParams']>, ParamsFromUrl<TRoute['path']>>;
  query: WithDefault<ZodInferOrType<TRoute['query']>, TsRestExpressDefaultQuery>;
  body: TRoute extends { body: infer TBodyType } ? ZodInferOrType<TBodyType> : unknown;
};

export type TsRestRequestHandler<TRoute extends AppRoute> = (
  req: TsRestRequest<TRoute>
) => Promise<TsRestResponses<TRoute>>;

export interface TsRestRequestHandlerOptions<TRoute extends AppRoute> {
  readonly middleware?: readonly RequestHandler[];
  readonly handler: TsRestRequestHandler<TRoute>;
}

export type TsRestRequestHandlers<TContract extends AppRouterContract> = {
  [TKey in keyof TContract]: TContract[TKey] extends AppRoute
    ? TsRestRequestHandler<TContract[TKey]> | TsRestRequestHandlerOptions<TContract[TKey]>
    : TContract[TKey] extends AppRouterContract
      ? TsRestRequestHandlers<TContract[TKey]>
      : never;
};

export interface TsRestExpressOptions {
  readonly onRequestValidationError?: 'next' | ((
    err: TsRestExpressRequestValidationError,
    req: Request,
    res: Response,
    next: NextFunction
  ) => void | Promise<void>);
  readonly onResponseValidationError?: 'next' | ((
    err: TsRestExpressResponseValidationError,
    req: Request,
    res: Response,
    next: NextFunction
  ) => void | Promise<void>);
}

export function addExpressRoutes<TRouter extends Router, TContract extends AppRouterContract>(
  router: TRouter,
  contract: TContract,
  handlers: TsRestRequestHandlers<TContract>,
  options: TsRestExpressOptions = {},
): TRouter {
  addExpressRoutesRecursive(router, contract, handlers, options);
  return router;
}

export function tsRestExpressErrorHandler(
  err: TsRestExpressRequestValidationError | TsRestExpressResponseValidationError,
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!res.headersSent) {
    if (err instanceof TsRestExpressRequestValidationError) {
      res.status(400).json({
        error: err.message,
        errors: {
          headers: err.headers?.issues ?? [],
          params: err.params?.issues ?? [],
          query: err.query?.issues ?? [],
          body: err.body?.issues ?? [],
        },
      });
    }
    else if (err instanceof TsRestExpressResponseValidationError) {
      res.status(500).json({
        error: 'Internal server error',
      });
    }
  }

  next(err);
}

export class TsRestExpressRequestValidationError extends Error {
  constructor(
    public readonly headers: ZodError | null,
    public readonly params: ZodError | null,
    public readonly query: ZodError | null,
    public readonly body: ZodError | null,
  ) {
    super('Request validation failed');
  }
}

export class TsRestExpressResponseValidationError extends Error {
  constructor(
    public readonly body: ZodError | null,
  ) {
    super('Response validation failed');
  }
}

function addExpressRoutesRecursive(
  router: Router,
  contract: AppRouterContract,
  handlers: TsRestRequestHandlers<any>,
  options: TsRestExpressOptions,
): void {
  for (const [key, contractOrRoute] of Object.entries(contract)) {
    if (isAppRoute(contractOrRoute)) {
      addExpressRoute(
        router,
        contractOrRoute,
        // Assume handlers match the contract.
        handlers[key] as TsRestRequestHandler<AppRoute> | TsRestRequestHandlerOptions<AppRoute>,
        options,
      );
    }
    else {
      addExpressRoutesRecursive(
        router,
        contractOrRoute,
        // Assume handlers match the contract.
        handlers[key] as TsRestRequestHandlers<AppRouterContract>,
        options,
      );
    }
  }
}

function addExpressRoute(
  router: Router,
  route: AppRoute,
  handlerOrHandlerOptions: TsRestRequestHandler<AppRoute> | TsRestRequestHandlerOptions<AppRoute>,
  options: TsRestExpressOptions,
): void {
  const method = HTTP_TO_EXPRESS_METHOD[route.method];
  const path = getExpressPath(route.path);
  const [middleware = [], tsRestHandler] = typeof handlerOrHandlerOptions === 'function'
    ? [undefined, handlerOrHandlerOptions]
    : [handlerOrHandlerOptions.middleware, handlerOrHandlerOptions.handler];
  const middlewareHandlers = Array.isArray(middleware) ? middleware : [middleware];
  const handler = getExpressHandler(route, tsRestHandler, options);

  router[method](path, ...middlewareHandlers, handler);
}

function getExpressPath(path: string): string {
  return path.replaceAll(/(?:^|\/)(:[^/?]+)\?/g, '{/$1}');
}

function getExpressHandler(
  route: AppRoute,
  handler: TsRestRequestHandler<AppRoute>,
  {
    onRequestValidationError = tsRestExpressErrorHandler,
    onResponseValidationError = tsRestExpressErrorHandler,
  }: TsRestExpressOptions,
): RequestHandler {
  return async (req, res, next) => {
    const headersResult = validate(route.headers, req.headers);
    const paramsResult = validate(route.pathParams, req.params);
    const queryResult = validate(route.query, req.query);
    const bodyResult = validate((route as { body?: unknown }).body, req.body);

    if (!headersResult.success || !paramsResult.success || !queryResult.success || !bodyResult.success) {
      const error = new TsRestExpressRequestValidationError(
        headersResult.success ? null : headersResult.error,
        paramsResult.success ? null : paramsResult.error,
        queryResult.success ? null : queryResult.error,
        bodyResult.success ? null : bodyResult.error,
      );

      if (onRequestValidationError === 'next') {
        next(error);
        return;
      }

      await onRequestValidationError(error, req, res, next);
      return;
    }

    const request = Object.create(req, {
      headers: { value: headersResult.data, writable: true, enumerable: true, configurable: true },
      params: { value: paramsResult.data, writable: true, enumerable: true, configurable: true },
      query: { value: queryResult.data, writable: true, enumerable: true, configurable: true },
      body: { value: bodyResult.data, writable: true, enumerable: true, configurable: true },
    });

    const response = await handler(request);
    const responseType = route.responses[response.status];

    if (responseType) {
      const responseBodyResult = validate(route.responses[response.status], response.body);

      if (!responseBodyResult.success) {
        const error = new TsRestExpressResponseValidationError(
          responseBodyResult.error,
        );

        if (onResponseValidationError === 'next') {
          next(error);
          return;
        }

        await onResponseValidationError(error, req, res, next);
        return;
      }

      response.body = responseBodyResult.data;

      if (isAppRouteNoBody(responseType)) {
        res.status(response.status).end();
        return;
      }

      if (isAppRouteOtherResponse(responseType)) {
        res.setHeader('content-type', responseType.contentType);
        res.status(response.status).send(response.body);
        return;
      }
    }

    res.status(response.status).json(response.body);
  };
}

function validate(type: unknown, data: unknown): SafeParseReturnType<any, any> {
  return isZodType(type) ? type.safeParse(data) : { success: true, data };
}

const HTTP_TO_EXPRESS_METHOD = {
  POST: 'post',
  GET: 'get',
  PUT: 'put',
  PATCH: 'patch',
  DELETE: 'delete',
} as const satisfies Record<AppRoute['method'], Lowercase<AppRoute['method']>>;
