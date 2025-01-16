import { ArgsError } from './error.js';
import { META, type MetaType } from './meta.js';

interface Option {
  readonly usage: string;
  readonly type: MetaType;
  readonly required?: boolean;
  readonly flags?: readonly string[];
  readonly parse?: (value: any, usage: string) => any;
}

interface Meta {
  readonly options: Readonly<Record<string, Option>>;
  readonly helpOption: Omit<Option, 'type'> | undefined;
  readonly versionOption: Omit<Option, 'type'> | undefined;
  readonly subcommands: Readonly<Record<string, WithMeta>>;
}

interface WithMeta {
  readonly [META]: Meta;
}

interface OptionConfig {
  readonly type: MetaType | 'help' | 'version';
  readonly flags?: readonly string[];
}

interface OptionArg {
  readonly flag: string;
  readonly value: string | undefined;
}

type Result = (
  | {
    readonly type: 'options';
    readonly options: Record<string, any>;
  }
  | {
    readonly type: 'subcommand';
    readonly subcommand: {
      readonly name: string;
      readonly result: Result;
    };
  }
  | {
    readonly type: 'help' | 'version';
  }
) & {
  readonly args: readonly string[];
  readonly command: any;
};

export function parse(args: readonly string[], command: WithMeta): Result {
  const { options, helpOption, versionOption, subcommands } = command[META];

  if (args[0] != null) {
    const subcommand = subcommands[args[0]];

    if (subcommand) {
      return {
        type: 'subcommand',
        subcommand: {
          name: args[0],
          result: parse(args.slice(1), subcommand),
        },
        args: [...args],
        command,
      };
    }
  }

  const entries = Object.entries(options);
  const optionEntries: [key: string, config: OptionConfig][] = [];

  if (versionOption) optionEntries.unshift(['', { type: 'version', ...versionOption }]);
  if (helpOption) optionEntries.unshift(['', { type: 'help', ...helpOption }]);

  const positionalKeys: string[] = [];
  let variadicKey: string | undefined;

  entries.forEach(([key, config]) => {
    switch (config.type) {
      case 'boolean':
      case 'string': {
        optionEntries.push([key, config]);
        break;
      }
      case 'positional': {
        positionalKeys.push(key);
        break;
      }
      case 'variadic': {
        variadicKey = key;
        break;
      }
    }
  });

  const remaining = [...args];
  const results: Record<string, any[]> = {};
  let forcePositional = false;

  while (remaining.length > 0) {
    const arg = remaining.shift()!;

    if (!forcePositional) {
      if (arg === '--') {
        forcePositional = true;
        continue;
      }

      const option = getOptionArg(arg);

      if (option) {
        const result = handleOption(option);
        if (result) return result;
        continue;
      }
    }

    const positionalKey = positionalKeys.shift() ?? variadicKey;

    if (positionalKey) {
      addResult(positionalKey, arg);
      continue;
    }

    throw new ArgsError(`Unexpected argument "${arg}".`);
  }

  for (const [key, option] of entries) {
    if (option.required && !results[key]?.length) {
      throw new ArgsError(`Missing required "${option.usage}".`);
    }

    if (option.parse) {
      results[key] = option.parse(results[key] ? [...results[key]] : [], option.usage);
    }
  }

  return { type: 'options', options: results, args, command };

  function addResult(key: string, value: any): void {
    results[key] = [...results[key] ?? [], value];
  };

  function handleOption(arg: OptionArg): Result | undefined {
    for (const [key, config] of optionEntries) {
      if (!config.flags?.includes(arg.flag)) continue;

      if (config.type === 'help' || config.type === 'version') {
        if (arg.value) throw new ArgsError(`Unexpected value for option "${arg.flag}".`);
        return { type: config.type, args, command };
      }

      if (config.type === 'boolean') {
        if (arg.value != null) throw new ArgsError(`Unexpected value for option "${arg.flag}".`);
        addResult(key, true);
        return;
      }

      if (config.type === 'string') {
        const value = arg.value ?? remaining.shift();
        if (value == null || value.startsWith('-')) throw new ArgsError(`Missing value for option "${arg.flag}".`);
        addResult(key, value);
        return;
      }
    }

    throw new ArgsError(`Unknown option "${arg.flag}".`);
  }
}

function getOptionArg(arg: string): OptionArg | undefined {
  if (!arg.startsWith('-')) {
    return;
  }

  const sep = arg.indexOf('=');

  if (sep > 0) {
    return { flag: arg.slice(0, sep), value: arg.slice(sep + 1) };
  }

  if (arg.length > 2 && arg.at(1) !== '-') {
    return { flag: arg.slice(0, 2), value: arg.slice(2) };
  }

  return { flag: arg, value: undefined };
}
