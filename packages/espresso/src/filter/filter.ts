import type { Request } from '../request/request.ts';
import type { Response } from '../response/response.ts';

/**
 * Handle all requests. The response headers will not have been sent when the
 * handler is called.
 */
export type Filter = (request: Request<{}>, response: Response) => void | Promise<void>;

export function createFilter<TFilter extends Filter>(filter: TFilter): TFilter {
  return filter;
}
