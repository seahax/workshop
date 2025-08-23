import { createSearchParametersProxy } from '../request/search-parameters-proxy.ts';
import { parseText } from './parse-text.ts';
import type { Parser } from './parser.ts';

export const parseUrlEncoded: Parser<Record<string, string | string[]>> = async (readable) => {
  const text = await parseText(readable);
  const params = new URLSearchParams(text);
  const proxy = createSearchParametersProxy(params);
  return proxy;
};
