import type { SchemaLike } from './schemas.ts';

export interface CueOptionConfig {
  readonly type: 'cue';
};

export interface FlagOptionConfig {
  readonly type: 'flag';
}

export interface CountOptionConfig {
  readonly type: 'count';
}

export interface ValueOptionConfig<
  TValue = unknown,
  TRequired extends boolean = boolean,
  TMultiple extends boolean = boolean,
> {
  readonly type: 'option';
  readonly schema: SchemaLike<TValue>;
  readonly required: TRequired;
  readonly multiple: TMultiple;
}

export interface ResetOptionConfig<TName extends `-${string}` = `-${string}`> {
  readonly type: 'reset';
  readonly name: TName;
}

export interface AliasOptionConfig<TName extends `-${string}` = `-${string}`> {
  readonly type: 'alias';
  readonly name: TName;
};

export type OptionConfig =
  | CueOptionConfig
  | FlagOptionConfig
  | CountOptionConfig
  | ValueOptionConfig
  | ResetOptionConfig
  | AliasOptionConfig
;

/**
 * When this option is parsed, the options parser will immediately stop parsing
 * and return the cue value.
 */
export function cue(): CueOptionConfig {
  return { type: 'cue' };
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
 * An option which requires a value.
 */
export function option<
  TValue = string,
  const TRequired extends boolean = false,
  const TMultiple extends boolean = false,
>(
  options: SchemaLike<TValue> | {
    readonly schema?: SchemaLike<TValue>;
    readonly required?: TRequired;
    readonly multiple?: TMultiple;
  } = {},
): ValueOptionConfig<TValue, TRequired, TMultiple> {
  const {
    schema = (value: unknown) => ({ value: value as TValue }),
    required = false as TRequired,
    multiple = false as TMultiple,
  } = '~standard' in options || typeof options === 'function' ? { schema: options } : options;

  return { type: 'option', schema, required, multiple };
}

/**
 * An alias for another option.
 */
export function alias<const TKey extends `-${string}`>(key: TKey): AliasOptionConfig<NoInfer<TKey>> {
  return { type: 'alias', name: key };
}

/**
 * Cancel out a `flag` (reset the value to false) or decrement a `count`
 * option.
 */
export function reset<const TKey extends `-${string}`>(key: TKey): ResetOptionConfig<NoInfer<TKey>> {
  return { type: 'reset', name: key };
}
