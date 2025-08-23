import type { RequestListener } from 'node:http';

import { applyErrorHandlers } from '../error/apply-error-handlers.ts';
import type { ErrorHandler } from '../error/error-handler.ts';
import { RequestValidationError } from '../error/request-validation-error.ts';
import { applyFilters } from '../filter/apply-filters.ts';
import type { Filter } from '../filter/filter.ts';
import type { Parser } from '../parser/parser.ts';
import { createRequest } from '../request/request.ts';
import { type CompressionProvider } from '../response/compression.ts';
import type { HeadersInit } from '../response/options.ts';
import { createResponse } from '../response/response.ts';
import type { Route } from '../route/route.ts';
import type { Router } from '../route/router.ts';

export interface ListenerConfig {
  readonly defaultHeaders: HeadersInit;
  readonly router: Router<Route>;
  readonly compressionProvider: CompressionProvider | undefined;
  readonly parsers: ReadonlyMap<string, Parser>;
  readonly filters: readonly Filter[];
  readonly errorHandlers: readonly ErrorHandler[];
  readonly defaultHandlers: readonly Filter[];
}

export function createListener({
  defaultHeaders,
  router,
  compressionProvider,
  parsers,
  filters,
  errorHandlers,
  defaultHandlers,
}: ListenerConfig): RequestListener {
  return (incomingMessage, serverResponse) => {
    let pathParameters: Record<string, string> = {};
    let cachedBody: Promise<unknown> | undefined;

    const getBody = (): Promise<unknown> => cachedBody ??= (async () => {
      try {
        const contentType = incomingMessage.headers['content-type']?.split(';')[0]
          ?.trim()
          .toLowerCase() ?? 'default';
        const parser = contentType ? parsers.get(contentType) : undefined;
        return await parser?.(incomingMessage);
      }
      catch (error) {
        throw new RequestValidationError([
          { message: `Failed to parse request body`, path: ['body'] },
        ], { cause: error });
      }
    })();

    const request = createRequest({ request: incomingMessage, getPathParameters: () => pathParameters, getBody });
    const response = createResponse({ headers: defaultHeaders, compressionProvider, response: serverResponse });

    (async () => {
      await applyFilters(filters, request, response);
      if (response.sent) return;

      const result = router.match(request.method, request.path);

      if (result.type === 'found') {
        pathParameters = result.pathParameters;
        await result.value.handler(request, response);
        if (response.sent) return;
      }

      await applyFilters(defaultHandlers, request, response);
      if (response.sent) return;

      await response.sendJson({ error: 'Not Found' }, { status: 404 });
    })().catch(async (error: unknown) => {
      const result = await applyErrorHandlers(errorHandlers, error, request, response);

      error = result.error;

      if (!result.handled) console.error(error);
      if (response.sent) return;

      if (error instanceof RequestValidationError) {
        await response.sendJson({ error: 'Invalid Request', issues: error.issues }, { status: 400 });
        return;
      }

      await response.sendJson({ error: 'Internal Server Error' }, { status: 500 });
    }).finally(() => {
      // Ensure the request is drained to prevent memory leaks.
      if (!incomingMessage.readableEnded) incomingMessage.resume();

      // Ensure the response is ended so that it isn't left hanging.
      if (!serverResponse.writableEnded) serverResponse.end();
    });
  };
}
