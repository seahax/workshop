import { type Next } from './next.js';
import { type ResponseEx } from './response.js';

export type Intercept = (
  request: Request,
  next: Next,
) => Promise<ResponseEx>;

export function createIntercept(intercept: Intercept): Intercept {
  return intercept;
}
