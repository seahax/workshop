export interface CommandsConfig {
  [key: string]: (args: string[]) => unknown;
}

export interface CommandsResult<TConfig extends string[] = string[]> {
  command: TConfig[number] | undefined;
  args: string[];
};

export type ValidatedOptionNames<TCommands extends string[]> = {
  [P in keyof TCommands]: TCommands[P] extends `-${string}` ? never : TCommands[P]
};

/**
 * Parse leading command line arguments as commands.
 */
export function parseCommands<const TConfig extends string[]>(
  args: readonly string[],
  config: ValidatedOptionNames<TConfig>,
): CommandsResult<TConfig> {
  const entries = config
    .map((command): { command: string; parts: readonly string[] } => ({
      command,
      parts: command.split(/\s+/u).filter((part) => part.length > 0),
    }))
    .filter(({ parts }) => parts.length > 0);

  for (const { command, parts } of entries) {
    if (parts.every((part, index) => args[index] === part)) {
      return { command, args: args.slice(parts.length) };
    }
  }

  return { command: undefined, args: [...args] };
}
