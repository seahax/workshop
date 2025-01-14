import { expect, test } from 'vitest';

import { renderHelp } from './help.js';

test('renderHelp', () => {
  const text = renderHelp({
    usage: ['line 0', 'line 1'],
    info: ['info 0', 'info 1'],
    options: [
      { usage: '--option', info: 'Option description.' },
      { usage: '--flag', info: `A longer description that should end up wrapping a few times. The quick red fox jumped over the slow dog. The cat in the hat sat in a vat with a bat.` },
    ],
    subcommands: [
      { usage: 'command', info: 'Command description.' },
      { usage: 'subcommand', info: 'Subcommand description.' },
    ],
    columns: 80,
  });

  expect(text).toMatchInlineSnapshot(`
    "Usage: line 0
    Usage: line 1

    info 0

    info 1

    Options:
      --option  Option description.
      --flag    A longer description that should end up wrapping a few times. The
                quick red fox jumped over the slow dog. The cat in the hat sat in a
                vat with a bat.

    Commands:
      command     Command description.
      subcommand  Subcommand description.
    "
  `);
});
