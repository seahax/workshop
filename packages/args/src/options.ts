import { type StandardSchemaV1 } from '@standard-schema/spec';

type KeyOfByType<T, TType> = T extends object ? { [K in keyof T]: T[K] extends TType ? K : never }[keyof T] : never;

export type Issue = StandardSchemaV1.Issue;

export type OptionName = `-${string}`;

export type ValueOptionConfig<
  TOutput = unknown, TInput extends unknown[] = unknown[],
> = StandardSchemaV1<TInput, TOutput>;

export interface FlagOptionConfig {
  readonly type: 'flag';
}

export interface CountOptionConfig {
  readonly type: 'count';
}

export interface NegationOptionConfig<TName extends OptionName = OptionName> {
  readonly type: 'negate';
  readonly name: TName;
}

export interface AliasOptionConfig<TName extends OptionName = OptionName> {
  readonly type: 'alias';
  readonly name: TName;
};

export interface CueOptionConfig<TValue extends string = string> {
  readonly type: 'cue';
  readonly value: TValue;
};

export type OptionConfig =
  | ValueOptionConfig
  | FlagOptionConfig
  | CountOptionConfig
  | NegationOptionConfig
  | AliasOptionConfig
  | CueOptionConfig;

export interface OptionConfigs {
  readonly [key: string]: OptionConfig;
}

export type ValidatedOptionConfigs<TConfigs extends OptionConfigs> = {
  [K in keyof TConfigs]: K extends 'positional'
    ? TConfigs[K] extends ValueOptionConfig // Positional only supports value config.
      ? TConfigs[K]
      : ValueOptionConfig
    : K extends '--' // The double dash argument is not a valid option name.
      ? never
      : K extends `-${string}` // All other option names must start with a dash.
        ? TConfigs[K] extends NegationOptionConfig<infer TName>
          ? TName extends KeyOfByType<TConfigs, FlagOptionConfig>
            ? TConfigs[K]
            : NegationOptionConfig<Extract<KeyOfByType<TConfigs, FlagOptionConfig>, `-${string}`>>
          : TConfigs[K] extends AliasOptionConfig<infer TName>
            ? TName extends KeyOfByType<TConfigs, Exclude<OptionConfig, AliasOptionConfig>>
              ? TConfigs[K]
              : AliasOptionConfig<Extract<KeyOfByType<TConfigs, Exclude<OptionConfig, AliasOptionConfig>>, `-${string}`>>
            : TConfigs[K] extends OptionConfig
              ? TConfigs[K]
              : never
        : never;
};

export interface OptionsFailure extends StandardSchemaV1.FailureResult {
  readonly value?: undefined;
}

export type OptionsResult<TValue = unknown> =
  | StandardSchemaV1.SuccessResult<TValue>
  | OptionsFailure;

export type InferOptionsValue<TConfig extends OptionConfigs> = any extends any
  ?
  | { -readonly [K in keyof TConfig as TConfig[K] extends ValueOptionConfig | FlagOptionConfig | CountOptionConfig
    ? K
    : never
    ]: (
      TConfig[K] extends ValueOptionConfig<infer TValue>
        ? TValue
        : TConfig[K] extends FlagOptionConfig
          ? boolean
          : TConfig[K] extends CountOptionConfig
            ? number
            : never
    );
  }
  | {
    [K in keyof TConfig]: (
      TConfig[K] extends CueOptionConfig<infer TValue>
        ? TValue
        : never
    )
  }[keyof TConfig]
  : never;

export interface OptionsInstance<TValue = unknown> extends StandardSchemaV1<string[], TValue> {
  parse<TResult = OptionsResult<TValue>>(
    args: readonly string[],
    callback?: (result: OptionsResult<TValue>) => TResult | Promise<TResult>
  ): Promise<TResult>;
}

const STANDARD_SCHEMA = { version: 1, vendor: '@seahax/args' } as const;

/**
 * Simple Standard Schema for options with values, when no advanced (3rd party)
 * validation is needed.
 */
export function option<TRequired extends boolean = false, TMultiple extends boolean = false>({
  required = false as TRequired,
  multiple = false as TMultiple,
}: { required?: TRequired; multiple?: TMultiple } = {}): StandardSchemaV1<
    string[],
    TMultiple extends true
      ? TRequired extends true ? [string, ...string[]] : string[]
      : TRequired extends true ? string : string | undefined
  > {
  return {
    '~standard': {
      ...STANDARD_SCHEMA,
      validate(value) {
        if (!Array.isArray(value)) return { issues: [{ message: 'Expected an array' }] };
        if (required && value.length === 0) return { issues: [{ message: `Required` }] };
        if (!value.every((value) => typeof value === 'string')) {
          return { issues: [{ message: 'Expected an array of strings' }] };
        }

        return { value: (multiple ? value : value[0]) as any };
      },
    },
  };
}

/**
 * An alias for another option.
 */
export function alias<TKey extends OptionName>(key: TKey): AliasOptionConfig<NoInfer<TKey>> {
  return { type: 'alias', name: key };
}

/**
 * A boolean option which does not take a value.
 */
export function flag(): FlagOptionConfig {
  return { type: 'flag' };
}

/**
 * A counter option where the value will be number of times the option is used.
 */
export function count(): CountOptionConfig {
  return { type: 'count' };
}

/**
 * Cancel out a `flag` (reset the value to false) or decrement a `count`
 * option.
 */
export function negate<TKey extends OptionName>(key: TKey): NegationOptionConfig<NoInfer<TKey>> {
  return { type: 'negate', name: key };
}

/**
 * When this option is parsed, the options parser will immediately stop parsing
 * and return the cue value.
 */
export function cue<const TCue extends string>(value: TCue): CueOptionConfig<NoInfer<TCue>> {
  return { type: 'cue', value };
}

/**
 * Create a command line options parser.
 */
export function createOptions<const TConfigs extends OptionConfigs>(
  configs: ValidatedOptionConfigs<TConfigs>,
): OptionsInstance<InferOptionsValue<TConfigs>> {
  async function parse<TResult = OptionsResult<InferOptionsValue<TConfigs>>>(
    args: readonly string[],
    callback: (
      result: OptionsResult<InferOptionsValue<TConfigs>>
    ) => TResult | Promise<TResult> = (result) => result as TResult,
  ): Promise<TResult> {
    const reduced = reduce(configs, args);

    // Args parsing failed.
    if (reduced.issues) return callback(reduced);
    // Parsed a cue option.
    if (typeof reduced.value === 'string') return callback(reduced as OptionsResult<InferOptionsValue<TConfigs>>);

    const validated = await validate(configs, reduced.value) as OptionsResult<InferOptionsValue<TConfigs>>;

    return callback(validated);
  }

  return {
    parse,
    '~standard': {
      ...STANDARD_SCHEMA,
      async validate(value) {
        return Array.isArray(value) && value.every((item) => typeof item === 'string')
          ? await parse(value)
          : { issues: [{ message: 'Expected an array of strings' }] };
      },
    },
  };
}

/**
 * Short-hand for `await createOptions(configs).parse(args)`.
 */
export async function parseOptions<
  const TConfigs extends OptionConfigs,
  TResult = OptionsResult<InferOptionsValue<TConfigs>>,
>(
  args: readonly string[],
  configs: ValidatedOptionConfigs<TConfigs>,
  callback?: (result: OptionsResult<InferOptionsValue<TConfigs>>) => TResult | Promise<TResult>,
): Promise<TResult> {
  return await createOptions(configs).parse(args, callback);
}

/**
 * Reduce the args string array into a map of option names to string, boolean,
 * and number values. Only unknown option and missing values issues are
 * reported at this stage.
 */
function reduce(
  configs: OptionConfigs,
  args: readonly string[],
): StandardSchemaV1.Result<Record<string, unknown> | string> {
  // Split the args into two sets if there is a double dash argument. The
  // first set is parsed for options, and the second set is not.
  const doubleDashIndex = args.indexOf('--');
  const [optionArgs, positionalArgs] = doubleDashIndex === -1
    ? [args, []]
    : [args.slice(0, doubleDashIndex), args.slice(doubleDashIndex + 1)];

  // Result accumulators.
  const issues: Issue[] = [];
  const value: Record<string, unknown> = {};

  for (let i = 0; i < optionArgs.length; ++i) {
    const arg = optionArgs[i]!;

    if (!isOptionArg(arg)) {
      // The argument is positional.
      value.positional = [...(value.positional as string[] | undefined ?? []), arg];
      continue;
    }

    // Split the argument into the option name and value if there is an equal
    // sign in it. If there is no equal sign, then the value is not "integral"
    // to the argument, and will consume the following argument later if
    // needed.
    const equalIndex = arg.indexOf('=');
    let [optionName, optionValue] = equalIndex === -1
      ? [arg, undefined]
      : [arg.slice(0, equalIndex) as OptionName, arg.slice(equalIndex + 1)];

    // Get the option config for the option name.
    let optionConfig = configs[optionName];

    if (!optionConfig) {
      issues.push({ message: `Unknown option "${optionName}"` });
      continue;
    }

    // If the option is an alias, then replace the option config with the
    // alias target's config.
    if ('type' in optionConfig && optionConfig.type === 'alias') {
      optionName = optionConfig.name;
      optionConfig = configs[optionName] as Exclude<OptionConfig, AliasOptionConfig>;
    }

    // If the option config is a schema, then the option requires a value.
    if (isStandardSchemaV1(optionConfig)) {
      // If there wasn't an integral value, then use the next argument as the
      // value.
      if (optionValue == null) {
        optionValue = optionArgs[i += 1];

        // An argument that matches the option name pattern cannot be used as
        // the value of another option.
        if (optionValue == null || isOptionArg(optionValue)) {
          i -= 1;
          issues.push({ message: `Missing option value`, path: [optionName] });
          continue;
        }
      }

      value[optionName] = [...(value[optionName] as string[] | undefined ?? []), optionValue];
      continue;
    }

    switch (optionConfig.type) {
      case 'flag': {
        value[optionName] = true;
        continue;
      }
      case 'negate': {
        value[optionConfig.name] = false;
        continue;
      }
      case 'count': {
        value[optionName] = (value[optionName] as number | undefined ?? 0) + 1;
        continue;
      }
      case 'cue': {
        // Cue options stop parsing immediately and return the cue value.
        return { value: optionConfig.value };
      }
    }
  }

  // If there are any issues, then parsing has failed and a failure result is
  // returned.
  if (issues.length > 0) return { issues };

  // Append the positional arguments (double dash delimited) to the positional
  // arguments found intermingled with the option arguments.
  const positional = [...(value.positional as string[] | undefined ?? []), ...positionalArgs];

  // Only add the positional arguments array to the reduced value if it's
  // non-empty.
  if (positional.length > 0) {
    value.positional = [...(value.positional as string[] | undefined ?? []), ...positionalArgs];
  }

  return { value };
}

/**
 * Parse and validate the individual reduced option values. This stage will
 * report standard schema validation issues, and will also provide default
 * values for flags and counts.
 */
async function validate(
  configs: OptionConfigs,
  rawValue: Record<string, unknown>,
): Promise<StandardSchemaV1.Result<Record<string, unknown>>> {
  const issues: Issue[] = [];
  const value: Record<string, unknown> = {};

  for (const name of Object.keys(configs)) {
    const optionConfig = configs[name as any]!;

    // If the option config is a schema, use the schema to parse and validate
    // the raw strings value.
    if (isStandardSchemaV1(optionConfig)) {
      const result = await optionConfig['~standard'].validate(rawValue[name] ?? []);

      if (result.issues) {
        result.issues.forEach((issue) => issues.push({ message: issue.message, path: [name, ...(issue.path ?? [])] }));
        continue;
      }

      value[name] = result.value;
      continue;
    }

    if (optionConfig.type === 'flag') {
      value[name] = rawValue[name] ?? false;
      continue;
    }

    if (optionConfig.type === 'count') {
      value[name] = rawValue[name] ?? 0;
      continue;
    }
  }

  // Extra arguments when no positional arguments are defined in the config
  // are considered a validation failure.
  if (configs.positional == null && rawValue.positional !== undefined) {
    issues.push({ message: 'Extra arguments', path: ['positional'] });
  }

  return issues.length > 0 ? { issues } : { value };
}

function isOptionArg(value: string): value is OptionName {
  return value.startsWith('-');
}

function isStandardSchemaV1(value: OptionConfig): value is ValueOptionConfig {
  return '~standard' in value;
}
