import { type Intercept } from './intercept.js';
import { Response } from './response.js';
import { signalAny } from './signal.js';

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
        return intercept(request, async (nextRequest = request) => {
          if (request.signal !== nextRequest.signal) {
            // If the signal has been replaced, then combine them so that
            // canceling any of them will still cancel the request.
            nextRequest = new Request(nextRequest, {
              signal: signalAny([request.signal, nextRequest.signal]),
            });
          }

          return next(nextRequest);
        });
      };
    }, last);

  return (...args) => first(new Request(...args));
}
