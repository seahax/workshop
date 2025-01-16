/* eslint-disable max-lines */
import { ArgsError } from './error.js';
import { type HelpConfig, renderHelp } from './help.js';
import { META, type Meta, type MetaOption, type WithMeta } from './meta.js';
import { parse } from './parse.js';
import { type Plugin } from './plugin.js';
import { last, multiple } from './utils.js';
import { getVersion } from './version.js';

type Simplify<T> = T extends object ? { [P in keyof T]: T[P] } : T;
type Flag = `-${string}`;

interface CommonOptionConfig {
  /**
   * An arguments template to display in the help text (eg. `--foo <value>`).
   */
  readonly usage?: string;

  /**
   * A one line description of the option.
   */
  readonly info?: string;
}

interface NamedOptionConfig {
  /**
   * Override the default option flags.
   */
  readonly flags?: readonly Flag[];
}

interface MaybeRequiredOptionConfig<TRequired extends boolean> {
  /**
   * Whether the option is required.
   */
  readonly required?: TRequired;
}

export interface HelpOptionConfig extends CommonOptionConfig, NamedOptionConfig {}

export interface VersionOptionConfig extends CommonOptionConfig, NamedOptionConfig {
  /**
   * Explicitly set the version instead of automatically reading it from the
   * nearest package.json file at runtime.
   */
  readonly version?: string | (() => Promise<string>);
}

export interface BooleanOptionConfig<TValue> extends CommonOptionConfig, NamedOptionConfig {
  /**
   * Parse raw boolean values. By default, returns true if the option is
   * found at least once, or false if the option is missing
   */
  readonly parse?: (values: boolean[], usage: string) => TValue;
}

export interface StringOptionConfig<TValue, TRequired extends boolean>
  extends CommonOptionConfig, NamedOptionConfig, MaybeRequiredOptionConfig<TRequired> {
  /**
   * Parse raw values. By default, the last value is returned (or undefined if
   * the option is missing).
   */
  readonly parse?: (values: TRequired extends true ? [string, ...string[]] : string[], usage: string) => TValue;
}

export interface PositionalOptionConfig<TValue, TRequired extends boolean>
  extends CommonOptionConfig, MaybeRequiredOptionConfig<TRequired> {
  /**
   * Parse a raw positional value. Be default, the unmodified value is returned
   * (or undefined if the option is missing)
   */
  readonly parse?: (values: TRequired extends true ? [string, ...string[]] : string[], usage: string) => TValue;
}

export interface VariadicOptionConfig<TValue, TRequired extends boolean>
  extends CommonOptionConfig, MaybeRequiredOptionConfig<TRequired> {
  /**
   * Parse raw variadic values. By default, an array of the unmodified values
   * is returned.
   */
  readonly parse?: (values: TRequired extends true ? [string, ...string[]] : string[], usage: string) => TValue;
}

export type CommandResult<
  TOptions extends Record<string, unknown>,
  TSubcommands extends Record<string, Command<any, any>>,
> = (
  | {
    readonly type: 'options';

    /**
     * The options parsed by the command.
     */
    readonly options: TOptions;

    readonly subcommand?: undefined;
  }
  | {
    readonly type: 'subcommand';

    /**
     * A subcommand result.
     */
    readonly subcommand: {
      [P in keyof TSubcommands]: {
        readonly name: P;
        readonly result: TSubcommands[P] extends Command<infer TSubcommandOptions, infer TSubcommandSubcommands>
          ? CommandResult<TSubcommandOptions, TSubcommandSubcommands>
          : never;
      };
    }[keyof TSubcommands];

    readonly options?: undefined;
  }
  | {
    readonly type: 'help' | 'version';
    readonly options?: undefined;
    readonly subcommand?: undefined;
  }
) & {
  /**
   * The raw arguments parsed by the command.
   */
  readonly args: readonly string[];

  /**
   * The command that was parsed.
   */
  readonly command: Command<TOptions, TSubcommands>;
};

export interface Command<
  TOptions extends Record<string, unknown>,
  TSubcommands extends Record<string, Command<any, any>>,
> extends WithMeta {
  /**
   * Use the command to parse the given arguments. The arguments must be
   * pre-trimmed to only include the arguments the command should parse.
   */
  parse(this: void, args: readonly string[]): Promise<CommandResult<TOptions, TSubcommands>>;

  /**
   * Get the help text for the command.
   */
  getHelp(this: void): string;

  /**
   * Print the help text for the command.
   */
  printHelp(this: void, stream?: { write: (text: string) => void }): void;
}

export interface CommandBuilder<
  TOptions extends Record<string, unknown>,
  TSubcommands extends Record<string, Command<any, any>>,
> extends Command<TOptions, TSubcommands> {
  /**
   * Apply a plugin to the command. A plugin is a function that makes changes
   * to the current command and returns the new command. It allows common
   * command configurations to be bundled up and applied to multiple commands.
   */
  use<
    TPluginOptions extends Record<string, unknown>,
    TPluginSubcommands extends Record<string, Command<any, any>>,
  >(
    this: void,
    plugin: Plugin<TPluginOptions, TPluginSubcommands>
  ): CommandBuilder<
    Simplify<Omit<TOptions, keyof TPluginOptions> & TPluginOptions>,
    Simplify<Omit<TSubcommands, keyof TPluginSubcommands> & TPluginSubcommands>
  >;

  /**
   * Override the default usage text for the command.
   */
  usage(this: void, text: string | string[]): CommandBuilder<TOptions, TSubcommands>;

  /**
   * Add informational text to the help text (ie. a description).
   */
  info(this: void, text: string | readonly string[]): CommandBuilder<TOptions, TSubcommands>;

  /**
   * Add an option for displaying the help text. The default flags are `--help`
   * and `-h`.
   */
  help(
    this: void,
    config?: false | string | readonly Flag[] | HelpOptionConfig
  ): CommandBuilder<TOptions, TSubcommands>;

  /**
   * Add an option to display the command version. The default flag is
   * `--version`.
   */
  version(
    this: void,
    config?: false | string | readonly Flag[] | VersionOptionConfig
  ): CommandBuilder<TOptions, TSubcommands>;

  /**
   * Add a boolean named option.
   */
  boolean<TKey extends string, TValue = boolean | undefined >(
    this: void,
    key: TKey,
    config?: string | readonly Flag[] | BooleanOptionConfig<TValue>,
  ): CommandBuilder<Simplify<Omit<TOptions, TKey> & { [key in TKey]: TValue }>, TSubcommands>;

  /**
   * Add a named option that accepts a value.
   */
  string<
    TKey extends string,
    TRequired extends boolean = false,
    TValue = TRequired extends true ? string : string | undefined,
  >(
    this: void,
    key: TKey,
    config?: string | readonly Flag[] | StringOptionConfig<TValue, TRequired>,
  ): CommandBuilder<Simplify<Omit<TOptions, TKey> & { [key in TKey]: TValue }>, TSubcommands>;

  /**
   * Add a positional option.
   */
  positional<
    TKey extends string,
    TRequired extends boolean = false,
    TValue = TRequired extends true ? string : string | undefined,
  >(
    this: void,
    key: TKey,
    config?: string | PositionalOptionConfig<TValue, TRequired>,
  ): CommandBuilder<Simplify<Omit<TOptions, TKey> & { [key in TKey]: TValue }>, TSubcommands>;

  /**
   * Accept all remaining arguments as a variadic option.
   */
  variadic<
    TKey extends string,
    TRequired extends boolean = false,
    TValue = TRequired extends true ? [string, ...string[]] : string[],
  >(
    this: void,
    key: TKey,
    config?: string | VariadicOptionConfig<TValue, TRequired>,
  ): CommandBuilder<Simplify<Omit<TOptions, TKey> & { [key in TKey]: TValue }>, TSubcommands>;

  /**
   * Remove an option from the command.
   */
  removeOption<TKey extends keyof TOptions | (string & {})>(
    key: TKey
  ): CommandBuilder<Simplify<Omit<TOptions, TKey>>, TSubcommands>;

  /**
   * Add a subcommand.
   */
  subcommand<TName extends string, TSubcommand extends WithMeta>(
    this: void,
    name: TName,
    subcommand: TSubcommand,
  ): CommandBuilder<TOptions, Simplify<Omit<TSubcommands, TName> & { [key in TName]: TSubcommand }>>;

  /**
   * Remove a subcommand from the command.
   */
  removeSubcommand<TName extends string>(
    name: TName | (string & {})
  ): CommandBuilder<TOptions, Simplify<Omit<TSubcommands, TName>>>;

  /**
   * Print an error message when parsing fails. Help will not be printed for
   * errors thrown by action callbacks.
   */
  printHelpOnError(this: void, enabled?: boolean): CommandBuilder<TOptions, TSubcommands>;

  /**
   * Add an action which will be invoked after the command is parsed, and
   * before any subcommand actions are invoked.
   */
  action(
    this: void,
    callback: (result: CommandResult<TOptions, TSubcommands>) => Promise<void>,
  ): Command<TOptions, TSubcommands>;
}

export function createCommand(): CommandBuilder<{}, {}> {
  return createCommandBuilder({
    usage: [],
    info: [],
    options: {},
    subcommands: {},
    helpOption: undefined,
    versionOption: undefined,
    printHelpOnError: false,
    version: '',
    action: async () => undefined,
  })
    .help()
    .version();
}

function createCommandBuilder(meta: Meta): CommandBuilder<any, any> {
  const self: CommandBuilder<any, any> = {
    [META]: meta,
    use(plugin) {
      const next: CommandBuilder<any, any> = plugin(self);
      return next;
    },
    usage(text) {
      return createCommandBuilder({
        ...meta,
        usage: [...meta.usage, ...(Array.isArray(text) ? text : (text ? [text] : []))],
      });
    },
    info(text) {
      return createCommandBuilder({
        ...meta,
        info: [...meta.info, ...(Array.isArray(text) ? text : (text ? [text] : []))],
      });
    },
    help(init) {
      if (init === false) {
        return createCommandBuilder({ ...meta, helpOption: undefined });
      }

      const {
        flags = ['--help', '-h'],
        usage = flags.join(', '),
        info = 'Print this help message.',
      } = getConfigObject(init);

      return createCommandBuilder({ ...meta, helpOption: { usage, info, flags } });
    },
    version(init) {
      if (init === false) {
        return createCommandBuilder({ ...meta, version: '', versionOption: undefined });
      }

      const {
        flags = ['--version'],
        usage = flags.join(', '),
        info = 'Print the version number.',
        version,
      } = getConfigObject(init);

      return createCommandBuilder({ ...meta, versionOption: { usage, info, flags, version } });
    },
    boolean(key, init) {
      const {
        parse = last(),
        flags = [`--${getLabel(key)}`],
        usage = flags.join(', '),
        info = '',
      } = getConfigObject(init);

      return addOption(key, { usage, info, type: 'boolean', flags, parse });
    },
    string(key, init) {
      const {
        parse = last(),
        required = false,
        flags = [`--${getLabel(key)}`],
        usage = `${flags.join(', ')} <value>`,
        info = '',
      } = getConfigObject(init);

      return addOption(key, { usage, info, type: 'string', flags, required, parse });
    },
    positional(key, init) {
      const {
        parse = last(),
        required = false,
        usage = required ? `<${getLabel(key)}>` : `[${getLabel(key)}]`,
        info = '',
      } = getConfigObject(init);

      return addOption(key, { usage, info, type: 'positional', required, parse });
    },
    variadic(key, init) {
      const {
        parse = multiple(),
        required = false,
        usage = required ? `<${getLabel(key)}...>` : `[${getLabel(key)}...]`,
        info = '',
      } = getConfigObject(init);

      return addOption(key, { usage, info, type: 'variadic', required, parse });
    },
    removeOption(key) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [key]: _, ...options } = meta.options;
      return createCommandBuilder({ ...meta, options });
    },
    subcommand(name, subcommand) {
      return createCommandBuilder({ ...meta, subcommands: { ...meta.subcommands, [name]: subcommand } });
    },
    removeSubcommand(name) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [name]: _, ...subcommands } = meta.subcommands;
      return createCommandBuilder({ ...meta, subcommands });
    },
    action(callback) {
      validateMeta(meta);
      return getCommand(createCommandBuilder({ ...meta, action: callback }));
    },
    async parse(args) {
      validateMeta(meta);

      let result: CommandResult<any, any>;

      try {
        result = parse(args, getCommand(self));
      }
      catch (error) {
        if (meta.printHelpOnError) {
          self.printHelp(process.stderr);
        }

        throw error instanceof ArgsError
          ? error
          : new ArgsError(error instanceof Error ? error.message : String(error), { cause: error });
      }

      await runActions(result);

      return result;
    },
    getHelp() {
      validateMeta(meta);
      return renderHelp(getHelpConfig(self[META]));
    },
    printHelp(writable: { write: (text: string) => void } = process.stdout) {
      writable.write(self.getHelp() + '\n');
    },
    printHelpOnError(enabled = true) {
      return createCommandBuilder({ ...meta, printHelpOnError: enabled });
    },
  };

  return self;

  function addOption(key: string, optionConfig: MetaOption): CommandBuilder<any, any> {
    return createCommandBuilder({ ...meta, options: { ...meta.options, [key]: optionConfig } });
  };
}

function getConfigObject<T extends CommonOptionConfig & NamedOptionConfig>(
  init: string | readonly Flag[] | T = {} as T,
): T {
  if (typeof init === 'string') return { info: init } as T;
  // eslint-disable-next-line unicorn/no-instanceof-array
  if (init instanceof Array) return { flags: init } as T;
  return init;
}

function getLabel(key: string): string {
  return key.replaceAll(/[A-Z]/gu, (match) => `-${match.toLowerCase()}`);
}

function getHelpConfig(meta: Meta): HelpConfig {
  const options: MetaOption[] = [
    ...Object.values(meta.options).map(({ type, usage, info }) => ({ type, usage, info })),
    ...(meta.versionOption ? [{ type: 'boolean' as const, ...meta.versionOption }] : []),
    ...(meta.helpOption ? [{ type: 'boolean' as const, ...meta.helpOption }] : []),
  ];

  const subcommands = Object.entries(meta.subcommands).map(([name, subcommand]) => ({
    usage: name,
    info: subcommand[META].info[0] ?? '',
  }));

  const columns = process.stdout.columns <= 0 ? 80 : Math.min(process.stdout.columns, 80);

  return { ...meta, options, subcommands, columns };
}

function getCommand(command: CommandBuilder<any, any>): Command<any, any> {
  return {
    [META]: command[META],
    parse: command.parse,
    getHelp: command.getHelp,
    printHelp: command.printHelp,
  };
}

function validateMeta(meta: Meta): void {
  const flags = new Set<string>();
  let variadicCount = 0;
  let optionalPositionalCount = 0;

  for (const option of Object.values(meta.options)) {
    if (option.type === 'variadic') {
      if (variadicCount > 0) {
        throw new ArgsError('Only one variadic argument is allowed.');
      }

      variadicCount += 1;
    }
    else if (option.type === 'positional') {
      if (option.required) {
        if (optionalPositionalCount > 0) {
          throw new ArgsError('Required arguments must come before optional arguments.');
        }
      }
      else {
        optionalPositionalCount += 1;
      }
    }

    for (const flag of option.flags ?? []) {
      if (flags.has(flag)) {
        throw new ArgsError(`Duplicate flag "${flag}".`);
      }

      flags.add(flag);
    }
  }
}

async function runActions(result: CommandResult<any, any>): Promise<void> {
  await result.command[META].action(result);

  if (result.type === 'help') {
    result.command.printHelp();
  }
  else if (result.type === 'version') {
    const versionOrGetter = result.command[META].versionOption?.version ?? getVersion;
    const version = typeof versionOrGetter === 'string' ? versionOrGetter : await versionOrGetter();
    console.log(version);
  }

  if (result.subcommand) {
    await runActions(result.subcommand.result);
  }
}
