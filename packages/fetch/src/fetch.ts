import { type Intercept } from './intercept.js';
import { Response } from './response.js';

type Step = (request: Request) => Promise<Response>;

export type Fetch = (
  ...args: Parameters<typeof fetch>
) => Promise<Response>;

export function createFetch(
  intercepts: readonly Intercept[] = [],
  innerFetch: typeof fetch = fetch,
): Fetch {
  const last: Step = async (request) => {
    const response = await innerFetch(request);

    return response instanceof Response
      ? response
      : new Response(response, request);
  };

  const first: Step = [...intercepts]
    .reverse()
    .reduce<Step>((next, intercept) => {
      return (request) => {
        return intercept(request, (nextRequest = request) => {
          return next(nextRequest);
        });
      };
    }, last);

  return (...args) => first(new Request(...args));
}
