/* eslint-disable max-lines */
import { ArgsError } from './error.js';
import { type HelpConfig, renderHelp } from './help.js';
import { META, type Meta, type MetaOption, type WithMeta } from './meta.js';
import { parse } from './parse.js';
import { last, multiple } from './utils.js';

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

interface NamedOptionConfig extends CommonOptionConfig {
  /**
   * Override the default option flags.
   */
  readonly flags?: readonly Flag[];
}

export interface HelpOptionConfig extends NamedOptionConfig {}

export interface VersionOptionConfig extends NamedOptionConfig {}

export interface BooleanOptionConfig<TValue> extends NamedOptionConfig {
  /**
   * Parse raw boolean values. By default, returns true if the option is
   * found at least once, or false if the option is missing
   */
  readonly parse?: (values: readonly boolean[], usage: string) => TValue;
}

export interface StringOptionConfig<TValue> extends NamedOptionConfig {
  /**
   * Parse raw string values. By default, the last value is returned (or
   * undefined if the option is missing).
   */
  readonly parse?: (values: readonly string[], usage: string) => TValue;
}

export interface PositionalOptionConfig<TValue> extends CommonOptionConfig {
  /**
   * Parse a raw positional value. Be default, the unmodified value is returned
   * (or undefined if the option is missing)
   */
  readonly parse?: (values: readonly string[], usage: string) => TValue;
}

export interface VariadicOptionConfig<TValue> extends CommonOptionConfig {
  /**
   * Parse raw variadic values. By default, an array of the unmodified values
   * is returned.
   */
  readonly parse?: (values: readonly string[], usage: string) => TValue;
}

export type CommandResult<
  TOptions extends Record<string, unknown>,
  TSubcommands extends Record<string, Command<any, any>>,
  TCommand extends ActionCommand<TOptions, TSubcommands> | Command<TOptions, TSubcommands>,
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
          ? CommandResult<TSubcommandOptions, TSubcommandSubcommands, TSubcommands[P]>
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
  readonly command: TCommand;
};

export interface ActionCommand<
  TOptions extends Record<string, unknown>,
  TSubcommands extends Record<string, Command<any, any>>,
> extends WithMeta {
  /**
   * Use the command to parse the given arguments. The arguments must be
   * pre-trimmed to only include the arguments the command should parse.
   */
  parse(args: readonly string[]): Promise<CommandResult<TOptions, TSubcommands, this>>;

  /**
   * Get the help text for the command.
   */
  getHelp(this: void): string;

  /**
   * Print the help text for the command.
   */
  printHelp(this: void, stream?: { write: (text: string) => void }): void;
}

export interface Command<
  TOptions extends Record<string, unknown>,
  TSubcommands extends Record<string, Command<any, any>>,
> extends ActionCommand<TOptions, TSubcommands> {
  /**
   * Apply a plugin to the command. A plugin is a function that makes changes
   * to the current command and returns the new command. It allows common
   * command configurations to be bundled up and applied to multiple commands.
   */
  plugin<TCommand extends Command<any, any>>(
    this: void,
    plugin: (command: Command<TOptions, TSubcommands>) => TCommand
  ): TCommand;

  /**
   * Override the default usage text for the command.
   */
  usage(this: void, text: string | string[]): Command<TOptions, TSubcommands>;

  /**
   * Add informational text to the help text (ie. a description).
   */
  info(this: void, text: string | readonly string[]): Command<TOptions, TSubcommands>;

  /**
   * Add an option for displaying the help text. The default flags are `--help`
   * and `-h`.
   */
  help(this: void, config?: false | string | readonly Flag[] | HelpOptionConfig): Command<TOptions, TSubcommands>;

  /**
   * Add an option to display the command version. The default flag is
   * `--version`.
   */
  version(
    this: void,
    version: false | string,
    config?: string | readonly Flag[] | VersionOptionConfig
  ): Command<TOptions, TSubcommands>;

  /**
   * Add a boolean named option.
   */
  boolean<TKey extends string, TValue = boolean | undefined >(
    this: void,
    key: TKey,
    config?: string | readonly Flag[] | BooleanOptionConfig<TValue>,
  ): Command<Simplify<Omit<TOptions, TKey> & { [key in TKey]: TValue }>, TSubcommands>;

  /**
   * Add a named option that accepts a value.
   */
  string<TKey extends string, TValue = string | undefined>(
    this: void,
    key: TKey,
    config?: string | readonly Flag[] | StringOptionConfig<TValue>,
  ): Command<Simplify<Omit<TOptions, TKey> & { [key in TKey]: TValue }>, TSubcommands>;

  /**
   * Add a positional option.
   */
  positional<TKey extends string, TValue = string | undefined>(
    this: void,
    key: TKey,
    config?: string | PositionalOptionConfig<TValue>,
  ): Command<Simplify<Omit<TOptions, TKey> & { [key in TKey]: TValue }>, TSubcommands>;

  /**
   * Accept all remaining arguments as a variadic option.
   */
  variadic<TKey extends string, TValue = string[]>(
    this: void,
    key: TKey,
    config?: string | VariadicOptionConfig<TValue>,
  ): Command<Simplify<Omit<TOptions, TKey> & { [key in TKey]: TValue }>, TSubcommands>;

  /**
   * Remove an option from the command.
   */
  removeOption<TKey extends keyof TOptions | (string & {})>(
    key: TKey
  ): Command<Simplify<Omit<TOptions, TKey>>, TSubcommands>;

  /**
   * Add a subcommand.
   */
  subcommand<TName extends string, TSubcommand extends WithMeta>(
    this: void,
    name: TName,
    subcommand: TSubcommand,
  ): Command<TOptions, Simplify<Omit<TSubcommands, TName> & { [key in TName]: TSubcommand }>>;

  /**
   * Remove a subcommand from the command.
   */
  removeSubcommand<TName extends string>(
    name: TName | (string & {})
  ): Command<TOptions, Simplify<Omit<TSubcommands, TName>>>;

  /**
   * Print an error message when parsing fails. Help will not be printed for
   * errors thrown by action callbacks.
   */
  printHelpOnError(this: void, enabled?: boolean): Command<TOptions, TSubcommands>;

  /**
   * Add an action which will be invoked after the command is parsed, and
   * before any subcommand actions are invoked.
   */
  action(
    this: void,
    callback: (
      result: CommandResult<TOptions, TSubcommands, ActionCommand<TOptions, TSubcommands>>
    ) => Promise<void>,
  ): ActionCommand<TOptions, TSubcommands>;
}

export function createCommand(): Command<{}, {}> {
  return createNextCommand({
    usage: [],
    info: [],
    options: {},
    subcommands: {},
    helpOption: undefined,
    versionOption: undefined,
    printHelpOnError: false,
    version: '',
    action: async () => undefined,
  });
}

function createNextCommand(meta: Meta): Command<any, any> {
  const self: Command<any, any> = {
    [META]: meta,
    plugin(plugin) {
      return plugin(self);
    },
    usage(text) {
      return createNextCommand({
        ...meta,
        usage: [...meta.usage, ...(Array.isArray(text) ? text : (text ? [text] : []))],
      });
    },
    info(text) {
      return createNextCommand({
        ...meta,
        info: [...meta.info, ...(Array.isArray(text) ? text : (text ? [text] : []))],
      });
    },
    help(init) {
      if (init === false) {
        return createNextCommand({ ...meta, helpOption: undefined });
      }

      const { flags = ['--help', '-h'], usage = flags.join(', '), info = '' } = getConfigObject(init);

      return createNextCommand({ ...meta, helpOption: { usage, info, flags } });
    },
    version(version, init) {
      if (version === false) {
        return createNextCommand({ ...meta, version: '', versionOption: undefined });
      }

      const { flags = ['--version'], usage = flags.join(', '), info = '' } = getConfigObject(init);

      return createNextCommand({ ...meta, versionOption: { usage, info, flags }, version });
    },
    boolean(key, init) {
      const {
        flags = [`--${getLabel(key)}`],
        usage = flags.join(', '),
        info = '',
        parse = last(),
      } = getConfigObject(init);

      return addOption(key, { usage, info, type: 'boolean', flags, parse });
    },
    string(key, init) {
      const {
        flags = [`--${getLabel(key)}`],
        usage = `${flags.join(', ')} <value>`,
        info = '',
        parse = last(),
      } = getConfigObject(init);

      return addOption(key, { usage, info, type: 'string', flags, parse });
    },
    positional(key, init) {
      const {
        usage = `<${getLabel(key)}>`,
        info = '',
        parse = last(),
      } = getConfigObject(init);

      return addOption(key, { usage, info, type: 'positional', parse });
    },
    variadic(key, init) {
      const {
        usage = `<${getLabel(key)}...>`,
        info = '',
        parse = multiple(),
      } = getConfigObject(init);

      return addOption(key, { usage, info, type: 'variadic', parse });
    },
    removeOption(key) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [key]: _, ...options } = meta.options;
      return createNextCommand({ ...meta, options });
    },
    subcommand(name, subcommand) {
      return createNextCommand({ ...meta, subcommands: { ...meta.subcommands, [name]: subcommand } });
    },
    removeSubcommand(name) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [name]: _, ...subcommands } = meta.subcommands;
      return createNextCommand({ ...meta, subcommands });
    },
    action(callback) {
      validateMeta(meta);
      return getActionCommand(createNextCommand({ ...meta, action: callback }));
    },
    async parse(args) {
      validateMeta(meta);

      let result: CommandResult<any, any, any>;

      try {
        result = parse(args, this);
      }
      catch (error) {
        if (meta.printHelpOnError) {
          self.printHelp(process.stderr);
        }

        throw error instanceof ArgsError
          ? error
          : new ArgsError(error instanceof Error ? error.message : String(error), { cause: error });
      }

      if (result.type === 'help') {
        self.printHelp();
        return result;
      }

      if (result.type === 'version') {
        console.log(meta.version);
        return result;
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
      return createNextCommand({ ...meta, printHelpOnError: enabled });
    },
  };

  return self;

  function addOption(key: string, optionConfig: MetaOption): Command<any, any> {
    return createNextCommand({ ...meta, options: { ...meta.options, [key]: optionConfig } });
  };
}

function getConfigObject<T extends NamedOptionConfig>(init: string | readonly Flag[] | T = {} as T): T {
  if (typeof init === 'string') return { info: init } as T;
  // eslint-disable-next-line unicorn/no-instanceof-array
  if (init instanceof Array) return { flags: init } as T;
  return init;
}

function getLabel(key: string): string {
  return key.replaceAll(/[A-Z]/gu, (match) => `-${match.toLowerCase()}`);
}

function getHelpConfig(meta: Meta): HelpConfig {
  return {
    ...meta,
    options: Object.values(meta.options).map(({ usage, info }) => ({ usage, info })),
    subcommands: Object.entries(meta.subcommands).map(([name, subcommand]) => ({
      usage: name,
      info: subcommand[META].info[0] ?? '',
    })),
    columns: process.stdout.columns <= 0 ? 80 : Math.min(process.stdout.columns, 80),
  };
}

function getActionCommand(command: Command<any, any>): ActionCommand<any, any> {
  const self: ActionCommand<any, any> = {
    [META]: command[META],
    parse: (...args) => command.parse.call(self, ...args),
    getHelp: command.getHelp,
    printHelp: command.printHelp,
  };

  return self;
}

function validateMeta(meta: Meta): void {
  const flags = new Set<string>();
  let variadicCount = 0;

  for (const option of Object.values(meta.options)) {
    if (option.type === 'variadic') {
      if (variadicCount > 0) {
        throw new ArgsError('Only one variadic option is allowed.');
      }

      variadicCount += 1;
    }

    for (const flag of option.flags ?? []) {
      if (flags.has(flag)) {
        throw new ArgsError(`Duplicate flag "${flag}".`);
      }

      flags.add(flag);
    }
  }
}

async function runActions(result: CommandResult<any, any, any>): Promise<void> {
  await result.command[META].action(result);

  if (result.subcommand) {
    await runActions(result.subcommand.result);
  }
}
