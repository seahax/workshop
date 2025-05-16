import { HELP_PATH_SEGMENT } from './constants.ts';
import {
  extraPositionalOptionIssue,
  missingOptionValue,
  missingRequiredOption,
  unexpectedOptionValue,
  unknownOptionIssue,
} from './issues.ts';
import {
  type AliasOptionConfig,
  type CountOptionConfig,
  type CueOptionConfig,
  type FlagOptionConfig,
  type OptionConfig,
  type ResetOptionConfig,
  type ValueOptionConfig,
} from './options-config.ts';
import { type SchemaIssue, type SchemaLike, type SchemaResult, validate } from './schemas.ts';

type Simplify<T> = T extends object ? { [K in keyof T]: T[K] } : T;
type KeyOfByType<T, TType> = T extends object ? { [K in keyof T]: T[K] extends TType ? K : never }[keyof T] : keyof T;

type OptionConfigs = {
  readonly [key: string]: any;
} & { // Provide hints for known keys.
  readonly positional?: any;
  readonly extraPositional?: any;
};

type AliasTargets<TConfigs extends OptionConfigs> = Extract<
  KeyOfByType<TConfigs, CueOptionConfig | FlagOptionConfig | CountOptionConfig | ValueOptionConfig>,
  `-${string}`
>;

type ResetTargets<TConfigs extends OptionConfigs> = Extract<
  KeyOfByType<TConfigs, FlagOptionConfig | CountOptionConfig | ValueOptionConfig>,
  `-${string}`
>;

type InferSchemaTupleType<TSchemas> = TSchemas extends readonly [infer TFirst, ...infer TRest]
  ? [TFirst extends SchemaLike<infer TValue> ? TValue : never, ...InferSchemaTupleType<TRest>]
  : [];

export type ValidatedOptionConfigs<TConfigs extends OptionConfigs> = {
  [K in keyof TConfigs]: K extends '--'
    ? never // The double dash option is reserved.
    : (
      | (K extends 'positional'
        ? TConfigs[K] extends readonly SchemaLike[]
          ? TConfigs[K]
          : readonly SchemaLike[]
        : never
      )

      | (K extends 'extraPositional'
        ? TConfigs[K] extends SchemaLike
          ? TConfigs[K]
          : SchemaLike
        : never
      )

      | (K extends `-${string}`
        ? TConfigs[K] extends CueOptionConfig | FlagOptionConfig | CountOptionConfig | ValueOptionConfig
          ? TConfigs[K]
          :
            | CueOptionConfig
            | FlagOptionConfig
            | CountOptionConfig
            | ValueOptionConfig
            | AliasOptionConfig<AliasTargets<TConfigs>>
            | ResetOptionConfig<ResetTargets<TConfigs>>
        : never
      )

      // Aliases must target cue, flag, count, or non-positional options.
      | (K extends `-${string}`
        ? TConfigs[K] extends AliasOptionConfig<AliasTargets<TConfigs>>
          ? TConfigs[K]
          : AliasOptionConfig<AliasTargets<TConfigs>>
        : never)

      // Resets must target flag, count, or non-positional options.
      | (K extends `-${string}`
        ? TConfigs[K] extends ResetOptionConfig<ResetTargets<TConfigs>>
          ? TConfigs[K]
          : ResetOptionConfig<ResetTargets<TConfigs>>
        : never)
      )
};

export type InferOptionsValue<TConfigs extends OptionConfigs> = any extends any
  ? (Simplify<
      | (
          {
            [K in KeyOfByType<TConfigs, FlagOptionConfig>]: boolean;
          } & {
            [K in KeyOfByType<TConfigs, CountOptionConfig>]: number;
          } & {
            [K in KeyOfByType<TConfigs, ValueOptionConfig>]: (
              TConfigs[K] extends ValueOptionConfig<infer TValue, infer TRequired, infer TMultiple>
                ? TRequired extends true
                  ? TMultiple extends true
                    ? [TValue, ...TValue[]]
                    : TValue
                  : TMultiple extends true
                    ? TValue[]
                    : TValue | undefined
                : never
            );
          } & {
            positional: [
              ...InferSchemaTupleType<TConfigs['positional']>,
              ...(TConfigs['extraPositional'] extends SchemaLike<infer TValue> ? TValue[] : []),
            ];
          }
        )
      | KeyOfByType<TConfigs, CueOptionConfig>
    >)
  : never;

/**
 * Parse command line arguments as options.
 */
export async function parseOptions<const TConfigs extends OptionConfigs>(
  args: readonly string[],
  configs: ValidatedOptionConfigs<TConfigs>,
): Promise<SchemaResult<InferOptionsValue<TConfigs>>> {
  const value: Record<string, any> = { positional: [] };
  const positionalArgs: string[] = [];
  const missingRequiredOptions = new Set<string>();
  const issues: SchemaIssue[] = [];
  const {
    positional: positionalSchemas = [],
    extraPositional: extraPositionalSchema,
    ...optionConfigs
  } = configs as {
    [key: `-${string}`]: OptionConfig;
  } & {
    positional?: SchemaLike[];
    extraPositional?: SchemaLike;
  };
  const doubleDashIndex = args.indexOf('--');
  const [parsableArgs, trailingPositionalArgs] = doubleDashIndex === -1
    ? [[...args], []]
    : [args.slice(0, doubleDashIndex), args.slice(doubleDashIndex + 1)];

  // Initialize the result value object and unused set.
  for (const [name, config] of Object.entries(optionConfigs)) {
    if (config.type === 'flag' || config.type === 'count' || config.type === 'option') {
      value[name] = getResetValue(config);
    }

    if (config.type === 'option' && config.required) {
      missingRequiredOptions.add(name);
    }
  }

  for (let i = 0; i < parsableArgs.length; i += 1) {
    const arg = parsableArgs[i]!;

    if (!isOptionArg(arg)) {
      positionalArgs.push(arg);
      continue;
    }

    const equalIndex = arg.indexOf('=');
    let [optionName, optionValue] = equalIndex === -1
      ? [arg, undefined]
      : [arg.slice(0, equalIndex) as `-${string}`, arg.slice(equalIndex + 1)];
    let config = optionConfigs[optionName];

    if (!config) {
      addIssue(unknownOptionIssue(optionName), { type: 'argument', key: i });
      continue;
    }

    if (config.type === 'alias') {
      optionName = config.name;
      config = optionConfigs[optionName] as Exclude<OptionConfig, AliasOptionConfig | ResetOptionConfig>;
    }

    if (config.type === 'option') {
      missingRequiredOptions.delete(optionName);

      if (optionValue == null) {
        optionValue = parsableArgs[i += 1];

        if (optionValue == null || isOptionArg(optionValue)) {
          i -= 1;
          addIssue(missingOptionValue(), { type: 'option', key: optionName });
          continue;
        }
      }

      const result = await validate(config.schema, optionValue);

      if (result.issues) {
        addIssue(result.issues, { type: 'option', key: optionName });
        continue;
      }

      if (config.multiple) {
        value[optionName].push(result.value);
        continue;
      }

      value[optionName] = result.value;
      continue;
    }

    if (optionValue != null) {
      addIssue(unexpectedOptionValue(), { type: 'option', key: optionName });
      continue;
    }

    switch (config.type) {
      case 'flag': {
        value[optionName] = true;
        break;
      }
      case 'count': {
        (value[optionName] as number) += 1;
        break;
      }
      case 'reset': {
        const target = optionConfigs[config.name] as Exclude<OptionConfig,
          | CueOptionConfig
          | AliasOptionConfig
          | ResetOptionConfig
        >;

        value[config.name] = getResetValue(target);
        break;
      }
      case 'cue': {
        return { value: optionName as InferOptionsValue<TConfigs> };
      }
    }
  }

  for (const name of missingRequiredOptions) {
    addIssue(missingRequiredOption(), { type: 'option', key: name });
  }

  positionalArgs.push(...trailingPositionalArgs);

  for (let i = 0; i < Math.max(positionalArgs.length, positionalSchemas.length); i += 1) {
    const config = positionalSchemas[i] ?? extraPositionalSchema;

    if (!config) {
      addIssue(extraPositionalOptionIssue(), { type: 'argument', key: i });
      continue;
    }

    const result = await validate(config, positionalArgs[i]);

    if (result.issues) {
      addIssue(result.issues, { type: 'positional', key: i });
      continue;
    }

    value.positional.push(result.value);
  }

  return issues.length > 0
    ? { issues }
    : { value: value as InferOptionsValue<TConfigs> };

  function addIssue(
    newIssue: SchemaIssue | readonly SchemaIssue[],
    context?: { type: 'option'; key: string } | { type: 'positional' | 'argument'; key: number },
  ): void {
    const newIssues = Array.isArray(newIssue) ? [...newIssue] : [newIssue];

    if (context) {
      const pathPrefixes = [{
        key: context.key,
        [HELP_PATH_SEGMENT]: context.type === 'option'
          ? `${context.type} "${context.key}"`
          : `${context.type} #${context.key + 1}`,
      }];

      for (let i = 0; i < newIssues.length; i += 1) {
        const { message, path = [] } = newIssues[i]!;
        newIssues[i] = { message, path: [...pathPrefixes, ...path] };
      }
    }

    issues.push(...newIssues);
  }
}

function getResetValue(config: FlagOptionConfig | CountOptionConfig | ValueOptionConfig): unknown {
  if (config.type === 'flag') return false;
  if (config.type === 'count') return 0;
  return config.multiple ? [] : undefined;
}

function isOptionArg(arg: string): arg is `-${string}` {
  return arg.startsWith('-');
}
