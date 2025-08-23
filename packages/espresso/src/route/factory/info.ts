import { randomUUID } from 'node:crypto';

import { HEADER_CACHE_CONTROL, HEADER_ETAG } from '../../response/constants.ts';
import { isModified } from '../../response/is-modified.ts';
import type { SendJsonOptions } from '../../response/options.ts';
import { createRoute, type Route } from '../route.ts';

const etag = randomUUID();
const lastModified = new Date();

export function createInfoRoute(
  info: object,
  options?: Pick<SendJsonOptions, 'headers' | 'replacer'>,
): Route {
  return createRoute('GET', '_info', async (request, response) => {
    response.setHeader(HEADER_CACHE_CONTROL, 'max-age=0');
    response.setHeader(HEADER_ETAG, etag);

    if (!isModified(request.$request.headers, etag, lastModified)) {
      await response.send(null, { status: 304, headers: options?.headers });
      return;
    }

    await response.sendJson(info, options);
  });
}
