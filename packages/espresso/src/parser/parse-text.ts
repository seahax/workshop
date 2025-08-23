import { text } from 'node:stream/consumers';

import type { Parser } from './parser.ts';

export const parseText: Parser<string> = async (readable) => {
  return await text(readable);
};
