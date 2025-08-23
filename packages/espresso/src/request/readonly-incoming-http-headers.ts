import type { IncomingHttpHeaders } from 'node:http';

export type ReadonlyIncomingHttpHeaders = {
  readonly [P in keyof IncomingHttpHeaders]: Readonly<IncomingHttpHeaders[P]>
};
