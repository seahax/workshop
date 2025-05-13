import { alias, createHelp, cue, parseOptions } from '@seahax/args';
import { main } from '@seahax/main';

import { createGame } from './game.ts';
import { createKeyboard } from './keyboard.ts';
import { createStore } from './store/store.ts';
import { createTerminal } from './terminal/terminal.ts';

main(async () => {
  const options = await parseOptions(process.argv.slice(2), {
    '--help': cue('help'),
    '-h': alias('--help'),
  });

  if (options.value === 'help') {
    help();
    return;
  }

  if (options.issues) {
    help.toStderr`{red ${options.issues[0]}}`;
    process.exitCode ||= 1;
    return;
  }

  const keyboard = createKeyboard();
  const terminal = createTerminal({ keyboard });
  const store = createStore();
  const game = createGame({ terminal, store });

  await game.start();
});

export const help = createHelp`
{bold Usage:} neverhaven [options]

A text-based fantasy adventure game!

{bold Options:}
  -h, --help   Show this help message.
`;
