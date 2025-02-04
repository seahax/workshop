import { createCommand } from '@seahax/args';
import { main } from '@seahax/main';

import { Game } from './game/game';
import { Terminal } from './game/terminal';
import { World } from './game/world';

await main(async () => {
  await createCommand()
    .usage('neverhaven [options]')
    .info('A text-based fantasy adventure game!')
    .action(async (result) => {
      if (result.type !== 'options') return;

      const terminal = new Terminal();
      const world = new World();
      const game = new Game({ terminal, world });

      await game.run();
    })
    .parse(process.argv.slice(2));
});
