/**
 * Error thrown internally by a controller if a handler fails. This is meant
 * to be caught by a parent controller or application to handle the wrapped
 * `cause`.
 */
export class ControllerError implements Error {
  readonly name = 'ControllerError';
  readonly message = `ControllerError: A controller handler failed`;
  readonly handled: boolean;
  readonly cause: unknown;

  constructor(cause: unknown, handled: boolean) {
    this.handled = handled;
    this.cause = cause;
  }

  toString(): string {
    return this.message;
  }
}
