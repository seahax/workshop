import { expect, test } from 'vitest';
import { z } from 'zod';

import { alias, count, createOptions, cue, flag, negate } from './options.ts';

test('schema option success', async () => {
  const options = createOptions({ '-a': z.number({ coerce: true }).array() });
  await expect(options.parse([])).resolves.toEqual({ value: { '-a': [] } });
  await expect(options.parse(['-a', '1', '-a', '2'])).resolves.toEqual({ value: { '-a': [1, 2] } });
});

test('schema option failure', async () => {
  const options = createOptions({ '-a': z.number({ coerce: true }).array() });

  await expect(options.parse(['-a', '1', '-a', 'foo'])).resolves.toEqual({
    issues: [{ message: 'Expected number, received nan', path: ['-a', 1] }],
  });
});

test('flag option', async () => {
  const options = createOptions({ '-a': flag(), '-b': negate('-a') });
  await expect(options.parse([])).resolves.toEqual({ value: { '-a': false } });
  await expect(options.parse(['-a'])).resolves.toEqual({ value: { '-a': true } });
  await expect(options.parse(['-a', '-b'])).resolves.toEqual({ value: { '-a': false } });
  await expect(options.parse(['-a', '-b', '-a'])).resolves.toEqual({ value: { '-a': true } });
});

test('count option', async () => {
  const options = createOptions({ '-a': count() });
  await expect(options.parse([])).resolves.toEqual({ value: { '-a': 0 } });
  await expect(options.parse(['-a'])).resolves.toEqual({ value: { '-a': 1 } });
  await expect(options.parse(['-a', '-a'])).resolves.toEqual({ value: { '-a': 2 } });
});

test('cue option', async () => {
  const options = createOptions({ '-a': cue('help') });
  await expect(options.parse([])).resolves.toEqual({ value: {} });
  await expect(options.parse(['-a'])).resolves.toEqual({ value: 'help' });
  // Cues are handled before validation, so invalid options should not prevent
  // the cue from being returned.
  await expect(options.parse(['--invalid', '-a'])).resolves.toEqual({ value: 'help' });
});

test('alias', async () => {
  const options = createOptions({ '-a': z.string().array(), '-b': alias('-a') });
  await expect(options.parse([])).resolves.toEqual({ value: { '-a': [] } });
  await expect(options.parse(['-b', 'foo'])).resolves.toEqual({ value: { '-a': ['foo'] } });
});

test('unknown option', async () => {
  const options = createOptions({ '-a': z.string().array() });
  await expect(options.parse(['-b'])).resolves.toEqual({ issues: [{ message: 'Unknown option "-b"' }] });
});

test('missing option value', async () => {
  const options = createOptions({ '-a': z.string().array() });
  await expect(options.parse(['-a'])).resolves.toEqual({
    issues: [{ message: 'Missing option value', path: ['-a'] }],
  });
});

test('required option', async () => {
  const options = createOptions({ '-a': z.string().array().nonempty('Required') });
  await expect(options.parse([])).resolves.toEqual({
    issues: [{ message: 'Required', path: ['-a'] }],
  });
});

test('positional', async () => {
  const options = createOptions({ positional: z.string().array() });
  await expect(options.parse(['foo', 'bar'])).resolves.toEqual({
    value: { positional: ['foo', 'bar'] },
  });
});

test('unknown positional', async () => {
  const options = createOptions({});
  await expect(options.parse(['foo', 'bar'])).resolves.toEqual({
    issues: [{ message: 'Extra arguments', path: ['positional'] }],
  });
});

test('invalid positional', async () => {
  const options = createOptions({ positional: z.tuple([z.string().email()]) });
  await expect(options.parse(['foo'])).resolves.toEqual({
    issues: [{ message: 'Invalid email', path: ['positional', 0] }],
  });
});

test('double dash', async () => {
  const options = createOptions({ '-a': z.string().array(), '-b': z.string().array(), positional: z.string().array() });
  await expect(options.parse(['-a=1', '-b=2', '--', '-a=3', '-b=4', '-b'])).resolves.toEqual({
    value: { '-a': ['1'], '-b': ['2'], positional: ['-a=3', '-b=4', '-b'] },
  });
});
