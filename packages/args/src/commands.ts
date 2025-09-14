export interface CommandsConfig {
  [key: string]: (args: string[]) => unknown;
}

export interface CommandsResult<TConfig extends string[] = string[]> {
  /**
   * The matched command, or `undefined` if no command was matched.
   */
  name: TConfig[number] | undefined;

  /**
   * @deprecated Use `name` instead.
   */
  command: TConfig[number] | undefined;

  /**
   * Remaining arguments following the matched command, or all arguments if
   * no command was matched.
   */
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
    .map((name): { name: string; parts: readonly string[] } => ({
      name,
      parts: name.split(/\s+/u).filter((part) => part.length > 0),
    }))
    .filter(({ parts }) => parts.length > 0);

  for (const { name, parts } of entries) {
    if (parts.every((part, index) => args[index] === part)) {
      return { name, command: name, args: args.slice(parts.length) };
    }
  }

  return { name: undefined, command: undefined, args: [...args] };
}
