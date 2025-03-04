import { createCommand } from '@seahax/args';
import { main } from '@seahax/main';

import { createGame } from './game.ts';
import { createKeyboard } from './keyboard.ts';
import { createStore } from './store/store.ts';
import { createTerminal } from './terminal.ts';

await main(async () => {
  await createCommand()
    .usage('neverhaven [options]')
    .info('A text-based fantasy adventure game!')
    .action(async (result) => {
      if (result.type !== 'options') return;

      const keyboard = createKeyboard();
      const terminal = createTerminal({ keyboard });
      const store = createStore();
      const game = createGame({ terminal, store });

      await game.start();
    })
    .parse(process.argv.slice(2));
});
