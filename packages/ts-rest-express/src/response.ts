import type { AppRoute, ResolveResponseType, ZodInputOrType } from '@ts-rest/core';
import type express from 'express';

import type { SmartPartial } from './types.ts';

export type ExpressRouteResponse<TRoute extends AppRoute> = {
  [TStatus in keyof TRoute['responses']]: TStatus extends number
    ? SmartPartial<{
      status: TStatus;
      headers?: Record<string, number | string | string[]>;
      cookies?: Record<string, string | (express.CookieOptions & { value: string })>;
      body: ZodInputOrType<ResolveResponseType<TRoute['responses'][TStatus]>>;
    }>
    : never;
}[keyof TRoute['responses']];
