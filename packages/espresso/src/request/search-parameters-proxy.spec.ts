import { expect, test } from 'vitest';

import { createSearchParametersProxy } from './search-parameters-proxy.ts';

test('createSearchParametersProxy', () => {
  const params = new URLSearchParams();
  params.set('a', '1');
  params.append('b', '1');
  params.append('b', '2');

  const proxy = createSearchParametersProxy(params);

  expect(proxy.a).toBe('1');
  expect(proxy.b).toEqual(['1', '2']);
  expect(proxy.c).toBeUndefined();
  expect({ ...proxy }).toEqual({ a: '1', b: ['1', '2'] });

  proxy.c = ['1'];
  expect(proxy.c).toEqual('1');

  delete proxy.c;
  expect(proxy.c).toBeUndefined();

  const { a } = proxy;
  expect(a).toBe('1');

  expect(() => Object.defineProperty(proxy, 'd', { value: '1' })).toThrow();
});
