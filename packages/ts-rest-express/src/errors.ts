import type { ZodIssue } from 'zod';

export class ExpressValidationError extends Error {
  readonly status: 400 | 500;
  readonly issues: Record<string, readonly ZodIssue[]>;

  constructor(message: string, status: 400 | 500, issues: Record<string, readonly ZodIssue[]>) {
    super(message);
    this.status = status;
    this.issues = issues;
  }
}

export class ExpressRequestValidationError extends ExpressValidationError {
  constructor(issues: Partial<Record<'headers' | 'params' | 'query' | 'body', ZodIssue[]>>) {
    super('Request validation failed', 400, issues);
  }
}

export class ExpressResponseValidationError extends ExpressValidationError {
  constructor(issues: Partial<Record<'body', ZodIssue[]>>) {
    super('Response validation failed', 500, issues);
  }
}
