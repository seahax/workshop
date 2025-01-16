export const META = Symbol.for('@seahax/args:config');

export type MetaType = 'boolean' | 'string' | 'positional' | 'variadic';

export interface MetaOption {
  readonly usage: string;
  readonly required?: boolean;
  readonly info: string;
  readonly type: MetaType;
  readonly flags?: readonly string[];
  readonly parse?: (value: any, usage: string) => any;
}

export interface Meta {
  readonly usage: readonly string[];
  readonly info: readonly string[];
  readonly options: Readonly<Record<string, MetaOption>>;
  readonly subcommands: Readonly<Record<string, WithMeta>>;
  readonly helpOption: {
    readonly usage: string;
    readonly info: string;
    readonly flags?: readonly string[];
  } | undefined;
  readonly versionOption: {
    readonly usage: string;
    readonly info: string;
    readonly flags?: readonly string[];
    readonly version?: string | (() => Promise<string>);
  } | undefined;
  readonly printHelpOnError: boolean;
  readonly version: string;
  readonly action: (result: any) => Promise<void | undefined | string>;
}

export interface WithMeta {
  [META]: Meta;
}
