import { expect, test } from 'vitest';

import { parseCommands } from './commands.ts';

test('parse commands', async () => {
  const parse = (args: string[]) => parseCommands(args, [
    'help',
    'version',
    'test',
    'list images',
  ]);

  expect(parse(['foo', 'bar'])).toMatchObject({ name: undefined, args: ['foo', 'bar'] });
  expect(parse(['help'])).toMatchObject({ name: 'help', args: [] });
  expect(parse(['list', 'images', 'foo', 'bar'])).toMatchObject({ name: 'list images', args: ['foo', 'bar'] });
});
