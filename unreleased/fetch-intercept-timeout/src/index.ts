import { createIntercept, type Intercept } from '@seahax/fetch';

export default function interceptTimeout(
  seconds: number,
  predicate: (request: Request) => boolean = () => true,
): Intercept {
  return createIntercept(async (request, next) => {
    if (seconds > 0 && predicate(request)) {
      request = new Request(request, {
        signal: AbortSignal.timeout(seconds * 1000),
      });
    }

    return await next(request);
  });
}
