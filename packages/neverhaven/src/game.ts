import type { Store } from './store/store.ts';
import { style } from './style.ts';
import { type Terminal } from './terminal.ts';

export interface Game {
  start(): Promise<void>;
  stop(): Promise<void>;
}

export function createGame({ terminal }: {
  readonly terminal: Terminal;
  readonly store: Store;
}): Game {
  let promise: Promise<void> | undefined;

  const self: Game = {
    async start() {
      if (!promise) {
        process.once('SIGINT', () => void self.stop());
        promise = Promise.allSettled([loop()]).then(() => self.stop());
      }

      return await promise;
    },
    async stop() {
      await terminal.close();
    },
  };

  return self;

  async function loop(): Promise<void> {
    await terminal.print`
    ${style.h1('Welcome to Neverhaven!')}

    If this is the first time you've played, you might want to type ${style.cmd('help')} or ${style.cmd('h')} for a
    list of commands. The help command will tell you what you can do in any situation. Type ${style.cmd('quit')},
    ${style.cmd('q')}, or press ${style.key('Ctrl+C')} to exit the game at any time.
  `;

    let value: string;

    do {
      value = await terminal.prompt();
      await terminal.print(`You entered: ${value}`);
    } while (value !== 'quit' && value !== 'q');
  }
}
