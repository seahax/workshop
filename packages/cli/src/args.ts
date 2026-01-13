import {
  parseArgs as parseArgs_,
  type ParseArgsConfig as ParseArgsConfig_,
  type ParseArgsOptionDescriptor as ParseArgsOptionDescriptor_,
} from 'node:util';

export interface ParseArgsConfig<
  TOptions extends Readonly<Record<string, ParseArgsOptionDescriptor>> = (
    Readonly<Record<string, ParseArgsOptionDescriptor>>
  ),
  TPositionals extends readonly string[] = readonly string[],
  TTokens extends boolean = boolean,
> extends Readonly<Pick<ParseArgsConfig_, 'args' | 'allowNegative' | 'tokens'>> {
  /**
   * @default process.argv.slice(2)
   */
  readonly args?: readonly string[];

  /**
   * Used to describe named options known to the parser.
   */
  readonly options?: TOptions;

  /**
   * Names of _required_ positional arguments known to the parser.
   */
  readonly positionals?: TPositionals;

  /**
   * Whether to allow extra positional arguments beyond those defined in the
   * `positionals` config property.
   *
   * @default false
   */
  readonly allowExtraPositionals?: boolean;

  readonly tokens?: TTokens;
}

export interface ParseArgsOptionDescriptor
  extends Readonly<Pick<ParseArgsOptionDescriptor_, 'type' | 'short' | 'multiple'>> {}

export type ParsedArgs<
  TOptions extends Readonly<Record<string, ParseArgsOptionDescriptor>>,
  TPositionals extends readonly string[],
  TTokens extends boolean = boolean,
> = any extends any ? {
  options: {
    -readonly [K in keyof TOptions]?:
    TOptions[K] extends { multiple: true }
      ? TOptions[K]['type'] extends 'boolean' ? [boolean, ...boolean[]] : [string, ...string[]]
      : TOptions[K]['type'] extends 'boolean' ? boolean : string;
  };
  positionals: [...{
    -readonly [K in keyof TPositionals]: string;
  }, ...string[]];
  tokens: TTokens extends true ? Token[] : undefined;
} : never;

export type Token = (ReturnType<typeof parseArgs_>['tokens'] & {})[number];

export function parseArgs<
  TOptions extends Readonly<Record<string, ParseArgsOptionDescriptor>> = {},
  const TPositionals extends readonly string[] = [],
  TTokens extends boolean = false,
>({
  args = process.argv.slice(2),
  options = {} as TOptions,
  positionals = [] as unknown as TPositionals,
  allowExtraPositionals = false,
  allowNegative = false,
  tokens = false as TTokens,
}: ParseArgsConfig<
  Readonly<Record<string, ParseArgsOptionDescriptor>> extends TOptions
    ? TOptions
    : Readonly<Record<string, ParseArgsOptionDescriptor>>,
  TPositionals,
  TTokens
> = {}): ParsedArgs<TOptions, TPositionals, TTokens> {
  const parsed = parseArgs_({
    args,
    options: Object.fromEntries(Object.entries(options).map(([name, descriptor]) => [
      name, {
        type: descriptor.type,
        short: descriptor.short,
        multiple: descriptor.multiple,
      },
    ])),
    allowPositionals: true,
    allowNegative,
    tokens,
  }) as ReturnType<typeof parseArgs_>;

  if (parsed.positionals.length < positionals.length) {
    throw new Error(`Missing required positional argument <${positionals[parsed.positionals.length]}>.`);
  }

  if (parsed.positionals.length > positionals.length && !allowExtraPositionals) {
    throw new Error(`Too many positional arguments.`);
  }

  const parsedOptions = Object.fromEntries(Object.entries(parsed.values).map(
    ([name, value]): [string, undefined | string | boolean | [string, ...string[]] | [boolean, ...boolean[]]] => {
      return !Array.isArray(value) || value.length > 0
        ? [name, value as [string, ...string[]] | [boolean, ...boolean[]]]
        : [name, undefined];
    },
  ));

  return {
    options: parsedOptions,
    positionals: parsed.positionals,
    tokens: parsed.tokens,
  } as ParsedArgs<TOptions, TPositionals, TTokens>;
}
