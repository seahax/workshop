import type { IncomingHttpHeaders } from 'node:http';

import { HEADER_IF_MODIFIED_SINCE, HEADER_IF_NONE_MATCH } from './constants.ts';

export function isModified(
  headers: IncomingHttpHeaders,
  etagValue?: string,
  lastModified?: Date,
): boolean {
  let conditional = false;
  let modified = false;

  if (HEADER_IF_NONE_MATCH in headers) {
    conditional = true;

    if (etagValue) {
      modified = headers[HEADER_IF_NONE_MATCH] !== etagValue;
    }
    else {
      modified = true;
    }
  }

  if (!modified && HEADER_IF_MODIFIED_SINCE in headers && headers[HEADER_IF_MODIFIED_SINCE]) {
    conditional = true;

    if (lastModified) {
      const lastModifiedSeconds = Math.floor(new Date(headers[HEADER_IF_MODIFIED_SINCE]).valueOf() / 1000);
      const modifiedSeconds = Math.floor(lastModified.valueOf() / 1000);
      modified = lastModifiedSeconds < modifiedSeconds;
    }
    else {
      modified = true;
    }
  }

  return !conditional || modified;
}
