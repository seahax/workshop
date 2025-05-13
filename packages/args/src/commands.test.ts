import { expect, test, vi } from 'vitest';

import { createCommands } from './commands.ts';

test('parse commands', async () => {
  const callback = vi.fn<<T>(value: T) => Promise<T>>().mockImplementation(async (value) => value);
  const commands = createCommands([
    'help',
    'version',
    'test',
    'list images',
  ]);

  await expect(commands.parse(['foo', 'bar'])).resolves
    .toEqual({ value: { command: undefined, args: ['foo', 'bar'] } });

  await expect(commands.parse(['help'])).resolves
    .toEqual({ value: { command: 'help', args: [] } });

  await expect(commands.parse(['list', 'images', 'foo', 'bar'], callback)).resolves
    .toEqual({ value: { command: 'list images', args: ['foo', 'bar'] } });

  expect(callback).toHaveBeenCalledWith({ value: { command: 'list images', args: ['foo', 'bar'] } });

  callback.mockClear();
  callback.mockImplementation(async () => 1);
  await expect(commands.parse(['list', 'images', 'foo', 'bar'], callback)).resolves.toEqual(1);
  expect(callback).toHaveBeenCalledWith({ value: { command: 'list images', args: ['foo', 'bar'] } });
});
