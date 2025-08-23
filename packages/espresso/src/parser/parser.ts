import type { Readable } from 'node:stream';

export type Parser<TResult = unknown> = (readable: Readable) => Promise<TResult>;
