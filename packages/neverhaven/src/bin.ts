#!/usr/bin/env node
import { alias, createHelp, cue, parseOptions } from '@seahax/args';

import { createGame } from './game.ts';
import { createKeyboard } from './keyboard.ts';
import { createStore } from './store/store.ts';
import { createTerminal } from './terminal/terminal.ts';

const help = createHelp`
{bold Usage:} neverhaven {blue [options]}

A text-based fantasy adventure game!

{bold Options:}
  {blue --help, -h}   Show this help message.
`;

await (async () => {
  const options = await parseOptions(process.argv.slice(2), {
    '--help': cue(),
    '-h': alias('--help'),
  });

  if (options.value === '--help') {
    help();
    process.exit();
  }

  if (options.issues) return help.error`{red ${options.issues[0]}}`.exit(1);

  const keyboard = createKeyboard();
  const terminal = createTerminal({ keyboard });
  const store = createStore();
  const game = createGame({ terminal, store });

  await game.start();
})();
