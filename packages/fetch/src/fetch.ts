import { type Intercept } from './intercept.js';
import { type ResponseEx } from './response.js';

type Step = (request: Request) => Promise<ResponseEx>;

export type Fetch = (
  ...args: Parameters<typeof fetch>
) => Promise<ResponseEx>;

export function createFetch(
  intercepts: readonly Intercept[],
  innerFetch: typeof fetch = fetch,
): Fetch {
  const last: Step = async (request) => {
    const response = await innerFetch(request);

    return 'request' in response
      ? response as ResponseEx
      : Object.assign(response, { request });
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
