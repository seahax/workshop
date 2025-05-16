import { expect, test } from 'vitest';

import { parseCommands } from './commands.ts';

test('parse commands', async () => {
  const parse = (args: string[]) => parseCommands(args, [
    'help',
    'version',
    'test',
    'list images',
  ]);

  expect(parse(['foo', 'bar'])).toEqual({ command: undefined, args: ['foo', 'bar'] });
  expect(parse(['help'])).toEqual({ command: 'help', args: [] });
  expect(parse(['list', 'images', 'foo', 'bar'])).toEqual({ command: 'list images', args: ['foo', 'bar'] });
});
