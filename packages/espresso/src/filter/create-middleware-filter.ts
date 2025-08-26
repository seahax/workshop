import type { Filter } from './filter.ts';
import type { NextMiddleware, SimpleMiddleware } from './middleware.ts';

export function createMiddlewareFilter(middleware: NextMiddleware | SimpleMiddleware): Filter {
  if (middleware.length === 2) {
    const filter: Filter = (request, response) => {
      (middleware as SimpleMiddleware)(request.$request, response.$response);
    };

    return filter;
  }

  const nextMiddlware = middleware as NextMiddleware;
  const filter: Filter = async (request, response) => {
    await new Promise<void>((resolve, reject) => {
      nextMiddlware(request.$request, response.$response, (error) => {
        if (error == null) {
          resolve();
        }
        else {
          // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
          reject(error);
        }
      });
    });
  };

  return filter;
}
