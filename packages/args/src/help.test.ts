import { afterEach, beforeEach, expect, test, vi } from 'vitest';

import { HELP_PATH_SEGMENT } from './constants.ts';
import { createHelp } from './help.ts';

beforeEach(() => {
  vi.spyOn(console, 'log').mockReset();
  vi.spyOn(console, 'error').mockReset();
});

afterEach(() => {
  vi.mocked(console.log).mockRestore();
  vi.mocked(console.error).mockRestore();
});

test('help text should end with a newline', () => {
  createHelp`foo`();
  expect(vi.mocked(console.log).mock.calls[0]?.[0]).toMatchInlineSnapshot(`
    "foo
    "
  `);
});

test('help text and suffix should be separated by a blank line', () => {
  createHelp`foo``bar`;
  expect(vi.mocked(console.log).mock.calls[0]?.[0]).toMatchInlineSnapshot(`
    "foo

    bar"
  `);
});

test('named option issue', () => {
  createHelp()`${{ message: 'foo', path: [{ key: '--foo', [HELP_PATH_SEGMENT]: 'option "--foo"' }, 0, 'foo'] }}`;
  expect(vi.mocked(console.log).mock.calls[0]?.[0]).toMatchInlineSnapshot(`"Error (option "--foo" at $[0].foo): foo"`);
});

test('positional option issue', () => {
  createHelp()`${{ message: 'foo', path: [{ key: 0, [HELP_PATH_SEGMENT]: 'positional #1' }, 'foo', 1] }}`;
  expect(vi.mocked(console.log).mock.calls[0]?.[0]).toMatchInlineSnapshot(`"Error (positional #1 at $foo[1]): foo"`);
});

test('argument issue', () => {
  createHelp()`${{ message: 'foo', path: [{ key: 0, [HELP_PATH_SEGMENT]: 'argument #1' }] }}`;
  expect(vi.mocked(console.log).mock.calls[0]?.[0]).toMatchInlineSnapshot(`"Error (argument #1): foo"`);
});

test('blank help', () => {
  createHelp()`foo`;
  expect(vi.mocked(console.log).mock.calls[0]?.[0]).toMatchInlineSnapshot(`"foo"`);
});
