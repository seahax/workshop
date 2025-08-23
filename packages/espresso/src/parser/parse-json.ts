import { json } from 'node:stream/consumers';

import type { Parser } from './parser.ts';

export const parseJson: Parser = async (readable) => {
  return await json(readable);
};
