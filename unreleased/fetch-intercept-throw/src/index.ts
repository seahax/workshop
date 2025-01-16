import { createIntercept, type Intercept } from '@seahax/fetch';

export default function interceptThrow(): Intercept {
  return createIntercept(async (request, next) => {
    const response = await next(request);
    response.assertOk();
    return response;
  });
}
