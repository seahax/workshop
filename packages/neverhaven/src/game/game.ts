import { style } from './style.ts';
import { type Terminal } from './terminal.ts';
import { type World } from './world.ts';

export class Game {
  readonly #terminal: Terminal;
  readonly #world: World;

  constructor({ terminal, world }: {
    readonly terminal: Terminal;
    readonly world: World;
  }) {
    this.#terminal = terminal;
    this.#world = world;
  }

  async run(): Promise<void> {
    void this.#world;

    process.once('SIGINT', () => {
      this.#terminal.close();
    });

    this.#terminal.open();
    await this.#terminal.print`
      ${style.h1('Welcome to Neverhaven!')}

      If this is the first time you've played, you might want to type ${style.cmd('help')} or ${style.cmd('h')} for a
      list of commands. The help command will tell you what you can do in any situation. Type ${style.cmd('quit')},
      ${style.cmd('q')}, or press ${style.key('Ctrl+C')} to exit the game at any time.
    `;

    let value: string;

    do {
      value = await this.#terminal.prompt();
      await this.#terminal.print(`You entered: ${value}`);
    } while (value !== 'quit' && value !== 'q');

    this.#terminal.close();

    return Promise.allSettled([
      this.#terminal.waitForClose(),
    ]).then(() => undefined);
  }
}
