import { expect, test } from 'vitest';
import { z } from 'zod';

import { parseOptions } from './options.ts';
import { alias, count, cue, flag, option, reset } from './options-config.ts';

test('schema option success', async () => {
  const parse = (args: string[]) => parseOptions(args, { '-a': option(z.number({ coerce: true })) });
  await expect(parse([])).resolves.toEqual({ value: { '-a': undefined, positional: [] } });
  await expect(parse(['-a', '1', '-a', '2'])).resolves.toEqual({ value: { '-a': 2, positional: [] } });
});

test('schema option failure', async () => {
  const parse = (args: string[]) => parseOptions(args, { '-a': option(z.number({ coerce: true })) });

  await expect(parse(['-a', '1', '-a', 'foo'])).resolves.toEqual({
    issues: [{ message: 'Expected number, received nan', path: [expect.objectContaining({ key: '-a' })] }],
  });
});

test('flag option', async () => {
  const parse = (args: string[]) => parseOptions(args, { '-a': flag(), '-b': reset('-a') });
  await expect(parse([])).resolves.toEqual({ value: { '-a': false, positional: [] } });
  await expect(parse(['-a'])).resolves.toEqual({ value: { '-a': true, positional: [] } });
  await expect(parse(['-a', '-b'])).resolves.toEqual({ value: { '-a': false, positional: [] } });
  await expect(parse(['-a', '-b', '-a'])).resolves.toEqual({ value: { '-a': true, positional: [] } });
});

test('count option', async () => {
  const parse = (args: string[]) => parseOptions(args, { '-a': count() });
  await expect(parse([])).resolves.toEqual({ value: { '-a': 0, positional: [] } });
  await expect(parse(['-a'])).resolves.toEqual({ value: { '-a': 1, positional: [] } });
  await expect(parse(['-a', '-a'])).resolves.toEqual({ value: { '-a': 2, positional: [] } });
});

test('cue option', async () => {
  const parse = (args: string[]) => parseOptions(args, { '-a': cue() });
  await expect(parse([])).resolves.toEqual({ value: { positional: [] } });
  await expect(parse(['-a'])).resolves.toEqual({ value: '-a' });
  // Cues are handled before validation, so invalid options should not prevent
  // the cue from being returned.
  await expect(parse(['--invalid', '-a'])).resolves.toEqual({ value: '-a' });
});

test('alias', async () => {
  const parse = (args: string[]) => parseOptions(args, { '-a': option(), '-b': alias('-a') });
  await expect(parse([])).resolves.toEqual({ value: { '-a': undefined, positional: [] } });
  await expect(parse(['-b', 'foo'])).resolves.toEqual({ value: { '-a': 'foo', positional: [] } });
});

test('unknown option', async () => {
  const parse = (args: string[]) => parseOptions(args, { '-a': option() });
  await expect(parse(['-b'])).resolves.toEqual({
    issues: [{ message: 'Unknown option "-b"', path: [expect.objectContaining({ key: 0 })] }],
  });
});

test('missing option value', async () => {
  const parse = (args: string[]) => parseOptions(args, { '-a': option() });
  await expect(parse(['-a'])).resolves.toEqual({
    issues: [{ message: 'Missing option value', path: [expect.objectContaining({ key: '-a' })] }],
  });
});

test('required option', async () => {
  const parse = (args: string[]) => parseOptions(args, { '-a': option({ required: true }) });
  await expect(parse([])).resolves.toEqual({
    issues: [{ message: 'Missing required option', path: [expect.objectContaining({ key: '-a' })] }],
  });
});

test('positional', async () => {
  const parse = (args: string[]) => parseOptions(args, { positional: [z.string().optional()] });
  await expect(parse([])).resolves.toEqual({ value: { positional: [undefined] } });
  await expect(parse(['foo'])).resolves.toEqual({ value: { positional: ['foo'] } });
});

test('unknown positional', async () => {
  const parse = (args: string[]) => parseOptions(args, { positional: [z.string()] });
  await expect(parse(['foo', 'bar'])).resolves.toEqual({
    issues: [{ message: 'Extra positional option', path: [expect.objectContaining({ key: 1 })] }],
  });
});

test('invalid positional', async () => {
  const parse = (args: string[]) => parseOptions(args, { positional: [z.string().email()] });
  await expect(parse(['foo'])).resolves.toEqual({
    issues: [{ message: 'Invalid email', path: [expect.objectContaining({ key: 0 })] }],
  });
});

test('double dash', async () => {
  const parse = (args: string[]) => parseOptions(args, { '-a': option(), '-b': option(), extraPositional: z.string() });
  await expect(parse(['-a=1', '-b=2', '--', '-a=3', '-b=4', '-b'])).resolves.toEqual({
    value: { '-a': '1', '-b': '2', positional: ['-a=3', '-b=4', '-b'] },
  });
});
