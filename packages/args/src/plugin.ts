import { type Command } from './command.js';

export type Plugin<
  TOptions extends Record<string, any>,
  TSubcommands extends Record<string, Command<any, any>>,
> = (command: Command<{}, {}>) => Command<TOptions, TSubcommands>;

export function createPlugin<
  TOptions extends Record<string, any>,
  TSubcommands extends Record<string, Command<any, any>>,
>(plugin: Plugin<TOptions, TSubcommands>): Plugin<TOptions, TSubcommands> {
  return plugin;
}
