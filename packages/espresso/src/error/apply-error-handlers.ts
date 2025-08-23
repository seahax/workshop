import type { Request } from '../request/request.ts';
import type { Response } from '../response/response.ts';
import { ControllerError } from './controller-error.ts';
import type { ErrorHandler } from './error-handler.ts';

export async function applyErrorHandlers(
  errorHandlers: readonly ErrorHandler[],
  initialError: unknown,
  request: Request<{}>,
  response: Response,
): Promise<{ error: unknown; handled: boolean; stopped: boolean }> {
  let handled = false;
  let stopped = false;
  let error = initialError;

  if (error instanceof ControllerError) {
    handled = error.handled;
    error = error.cause;
  }

  for (const errorHandler of errorHandlers) {
    try {
      await errorHandler({
        error,
        request,
        response,
        skipRemainingHandlers: () => {
          stopped = true;
        },
      });

      handled = true;

      if (stopped) {
        break;
      }
    }
    catch (newError: unknown) {
      if (newError instanceof ControllerError) {
        error = newError.cause;
        handled = newError.handled;
      }
      else {
        error = newError;
        handled = false;
      }
    }
  }

  return { error, handled, stopped };
}
