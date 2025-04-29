import { type AppRoute, isAppRouteNoBody, isAppRouteOtherResponse } from '@ts-rest/core';
import type express from 'express';

import { ExpressRequestValidationError, ExpressResponseValidationError } from './errors.ts';
import { parse } from './parse.ts';
import type { ExpressRouteRequest } from './request.ts';
import type { ExpressRouteResponse } from './response.ts';

export type ExpressRouteHandler<TRoute extends AppRoute> = (
  req: ExpressRouteRequest<TRoute>
) => Promise<ExpressRouteResponse<TRoute>>;

export function getExpressRequestHandler(
  appRoute: AppRoute,
  handler: ExpressRouteHandler<AppRoute>,
): express.RequestHandler {
  return async (req, res, next) => {
    const parsedHeaders = parse(appRoute.headers, req.headers);
    const parsedParams = parse(appRoute.pathParams, req.params);
    const parsedQuery = parse(appRoute.query, req.query);
    const parsedBody = parse((appRoute as { body?: unknown }).body, req.body);

    if (!parsedHeaders.success || !parsedParams.success || !parsedQuery.success || !parsedBody.success) {
      next(new ExpressRequestValidationError({
        headers: parsedHeaders.error?.issues,
        params: parsedParams.error?.issues,
        query: parsedQuery.error?.issues,
        body: parsedBody.error?.issues,
      }));
      return;
    }

    const request = Object.create(req, {
      headers: { value: parsedHeaders.data, writable: true, enumerable: true, configurable: true },
      cookies: { value: req.cookies ?? {}, writable: true, enumerable: true, configurable: true },
      params: { value: parsedParams.data, writable: true, enumerable: true, configurable: true },
      query: { value: parsedQuery.data, writable: true, enumerable: true, configurable: true },
      body: { value: parsedBody.data, writable: true, enumerable: true, configurable: true },
      res: { value: res, writable: true, enumerable: true, configurable: true },
    });

    const response = await handler(request);
    const appRouteResponse = appRoute.responses[response.status];

    if (!appRouteResponse) {
      // The handler returned a status code that was not defined in the TsRest
      // router contract. This is an implementation error (bug) that should not
      // happen in Typescript.
      next(new ExpressResponseValidationError({}));
      return;
    }

    const parsedResponseBody = parse(appRouteResponse, response.body);

    if (!parsedResponseBody.success) {
      next(new ExpressResponseValidationError({ body: parsedResponseBody.error.issues }));
      return;
    }

    response.body = parsedResponseBody.data;

    if (response.headers) {
      Object.entries(response.headers).forEach(([key, value]) => res.setHeader(key, value));
    }

    if (response.cookies) {
      Object.entries(response.cookies).forEach(([key, value]) => {
        if (typeof value === 'string') {
          res.cookie(key, value);
        }
        else {
          const { value: cookieValue, ...options } = value;
          res.cookie(key, cookieValue, options);
        }
      });
    }

    if (isAppRouteNoBody(appRouteResponse)) {
      res.status(response.status).end();
      return;
    }

    if (isAppRouteOtherResponse(appRouteResponse)) {
      res.setHeader('content-type', appRouteResponse.contentType);
      res.status(response.status).send(response.body);
      return;
    }

    res.status(response.status).json(response.body);
  };
}
