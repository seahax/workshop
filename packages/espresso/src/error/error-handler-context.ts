import type { Request } from '../request/request.ts';
import type { Response } from '../response/response.ts';

export interface ErrorHandlerContext {
  readonly error: unknown;
  readonly request: Request<{}>;
  readonly response: Response;
  /**
   * _This should only be called if specifically necesary, because it may cause
   * gaps in error reporting!_
   *
   * Call this function to skip all remaining error handlers.
   */
  readonly skipRemainingHandlers: () => void;
}
