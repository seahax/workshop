import type { Command } from './command.ts';

export interface SubcommandsOptions {
  /**
   * Array of argument strings.
   *
   * @default process.argv.slice(2)
   */
  readonly args?: readonly string[];
}

export async function subcommands(
  commands: Readonly<Record<string, Command>>,
  {
    args = process.argv.slice(2),
  }: SubcommandsOptions = {},
): Promise<void> {
  const [commandName, ...commandArgs] = args;

  if (commandName == null) {
    return;
  }

  if (!(commandName in commands) || typeof commands[commandName] !== 'function') {
    throw new Error(`Unknown command "${commandName}".`);
  }

  await commands[commandName](commandArgs);
}
