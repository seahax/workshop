import { type Command, type CommandBuilder } from './command.ts';

export type Plugin<
  TOptions extends Record<string, any>,
  TSubcommands extends Record<string, Command<any, any>>,
> = (command: CommandBuilder<{}, {}>) => CommandBuilder<TOptions, TSubcommands>;

export function createPlugin<
  TOptions extends Record<string, any>,
  TSubcommands extends Record<string, Command<any, any>>,
>(plugin: Plugin<TOptions, TSubcommands>): Plugin<TOptions, TSubcommands> {
  return plugin;
}
