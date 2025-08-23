import type { StandardSchemaV1 } from '@standard-schema/spec';

/**
 * Error thrown by the `useRequestValidation` helper. Default error handling
 * will return a `400 Bad Request` when this error is received.
 */
export class RequestValidationError extends Error implements StandardSchemaV1.FailureResult {
  readonly issues: readonly StandardSchemaV1.Issue[];

  constructor(issues: readonly StandardSchemaV1.Issue[], options?: ErrorOptions) {
    super('Request validation failed', options);
    this.name = 'RequestValidationError';
    this.issues = issues;
  }
}
