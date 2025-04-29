import type { IncomingHttpHeaders } from 'node:http';

import type { AppRoute, ParamsFromUrl, ZodInferOrType } from '@ts-rest/core';
import type express from 'express';

import type { WithDefault } from './types.ts';

export interface ExpressRouteRequest<TRoute extends AppRoute>
  extends Omit<express.Request<unknown, unknown, unknown, unknown>,
    | 'res'
    | 'next'
    | 'headers'
    | 'cookies'
    | 'params'
    | 'query'
    | 'body'
  > {
  headers: WithDefault<ZodInferOrType<TRoute['headers']>, IncomingHttpHeaders>;
  cookies: Record<string, string | undefined>;
  params: WithDefault<ZodInferOrType<TRoute['pathParams']>, ParamsFromUrl<TRoute['path']>>;
  query: WithDefault<ZodInferOrType<TRoute['query']>, express.Request['query']>;
  body: TRoute extends { body: infer TBodyType } ? ZodInferOrType<TBodyType> : unknown;
  res: express.Response;
};
