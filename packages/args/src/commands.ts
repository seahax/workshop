import type { StandardSchemaV1 } from '@standard-schema/spec';

import { createStandardSchema } from './standard.ts';

export interface CommandsConfig {
  [key: string]: (args: string[]) => unknown;
}

export interface CommandsValue<TConfig extends string[] = string[]> {
  readonly command: TConfig[number] | undefined;
  readonly args: string[];
}

export type CommandsResult<
  TConfig extends string[] = string[],
> = StandardSchemaV1.SuccessResult<CommandsValue<TConfig>>;

export interface Commands<
  TConfig extends string[] = string[],
> extends StandardSchemaV1<string[], CommandsValue<TConfig>> {
  parse<TResult = CommandsResult<TConfig>>(
    args: readonly string[],
    callback?: (result: CommandsResult<TConfig>) => TResult | Promise<TResult>
  ): Promise<TResult>;
}

export type ValidatedOptionNames<TCommands extends string[]> = {
  [P in keyof TCommands]: TCommands[P] extends `-${string}` ? never : TCommands[P]
};

/**
 * Create a command line commands parser.
 */
export function createCommands<const TConfig extends string[]>(
  config: ValidatedOptionNames<TConfig>,
): Commands<TConfig> {
  const entries = config
    .map((command): { command: string; parts: readonly string[] } => ({
      command,
      parts: command.split(/\s+/u).filter((part) => part.length > 0),
    }))
    .filter(({ parts }) => parts.length > 0);

  async function parse<TResult = CommandsResult<TConfig>>(
    args: readonly string[],
    callback: (result: CommandsResult<TConfig>) => TResult | Promise<TResult> = (result) => result as TResult,
  ): Promise<TResult> {
    for (const { command, parts } of entries) {
      if (parts.every((part, index) => args[index] === part)) {
        return callback({ value: { command, args: args.slice(parts.length) } });
      }
    }

    return callback({ value: { command: undefined, args: [...args] } });
  }

  return { parse, '~standard': createStandardSchema(parse) };
}

/**
 * Short-hand for `await createCommands(config).parse(args)`.
 */
export async function parseCommands<const TConfig extends string[], TResult = CommandsResult<TConfig>>(
  args: readonly string[],
  config: ValidatedOptionNames<TConfig>,
  callback: (result: CommandsResult<TConfig>) => TResult | Promise<TResult> = (result) => result as TResult,
): Promise<TResult> {
  return await createCommands(config).parse(args, callback);
}
