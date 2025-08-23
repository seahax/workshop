import type { ServerResponse } from 'node:http';

import type { CompressionProvider } from './compression.ts';
import { HEADER_CONTENT_TYPE } from './constants.ts';
import type { SendJsonOptions } from './options.ts';
import { send } from './send.ts';

/**
 * Send a JSON response body.
 */
export async function sendJson(
  response: ServerResponse,
  compressionProvider: CompressionProvider | undefined,
  data: unknown,
  { replacer, ...options }: SendJsonOptions = {},
): Promise<void> {
  if (!response.hasHeader(HEADER_CONTENT_TYPE)) {
    response.setHeader(HEADER_CONTENT_TYPE, 'application/json');
  }

  await send(response, compressionProvider, JSON.stringify(data, replacer), options);
}
