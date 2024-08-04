import { type Next } from './next.js';
import { type Response } from './response.js';

export type Intercept = (
  request: Request,
  next: Next,
) => Promise<Response>;

export function createIntercept(intercept: Intercept): Intercept {
  return intercept;
}
