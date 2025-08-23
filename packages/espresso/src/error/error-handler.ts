import type { ErrorHandlerContext } from './error-handler-context.ts';

/**
 * Handle an error thrown by a filter, route handler, or another error handler.
 *
 * If the error handler returns `StopErrorHandling`, then no additional error
 * handlers will be called.
 */
export type ErrorHandler = (context: ErrorHandlerContext) => void | Promise<void>;

export function createErrorHandler<TErrorHandler extends ErrorHandler>(errorHandler: TErrorHandler): TErrorHandler {
  return errorHandler;
}
