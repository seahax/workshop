import type { ErrorHandler } from '../error/error-handler.ts';
import type { Filter } from '../filter/filter.ts';
import type { ErrorMiddleware, Middleware, NextMiddleware, SimpleMiddleware } from './middleware.ts';

export function convertMiddleware(middleware: Middleware): ['filter', Filter] | ['errorHandler', ErrorHandler] {
  if (middleware.length === 2) {
    const filter: Filter = (request, response) => {
      (middleware as SimpleMiddleware)(request.$request, response.$response);
    };

    return ['filter', filter];
  }

  if (middleware.length === 3) {
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

    return ['filter', filter];
  }

  const errorMiddleware = middleware as ErrorMiddleware;
  const errorHandler: ErrorHandler = async ({ error, request, response }) => {
    await new Promise<void>((resolve, reject) => {
      try {
        errorMiddleware(error, request.$request, response.$response, (newError) => {
          if (newError == null) {
            resolve();
          }
          else {
            // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
            reject(newError);
          }
        });
      }
      catch (error: unknown) {
        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
        reject(error);
      }
    });
  };

  return ['errorHandler', errorHandler];
}
