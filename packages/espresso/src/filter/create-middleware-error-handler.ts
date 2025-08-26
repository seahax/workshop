import type { ErrorHandler } from '../error/error-handler.ts';
import type { ErrorMiddleware } from './middleware.ts';

export function createMiddlewareErrorHandler(middleware: ErrorMiddleware): ErrorHandler {
  const errorHandler: ErrorHandler = async ({ error, request, response }) => {
    await new Promise<void>((resolve, reject) => {
      try {
        middleware(error, request.$request, response.$response, (newError) => {
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

  return errorHandler;
}
