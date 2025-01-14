import { ArgsError } from './error.js';

type MutableArray<T extends readonly any[]> = { -readonly [P in keyof T]: T[P] };

export function last<T extends any[], V = T[number] | undefined>(
  callback: (value: T[number] | undefined, usage: string) => V = (value) => value as V,
): (value: readonly T[], usage: string) => V {
  return (value, usage) => callback(value.at(-1), usage);
}

export function required<T, V = T>(
  callback: (value: readonly [T, ...T[]], usage: string) => V = (value) => value.at(-1) as V,
): (value: readonly T[], usage: string) => V {
  return (value, usage) => {
    if (value.length === 0) throw new ArgsError(`Missing "${usage}".`);
    return callback(value as readonly [T, ...T[]], usage);
  };
};

export function multiple<T extends readonly any[], V = MutableArray<T>>(
  callback: (value: MutableArray<T>, usage: string) => V = (value) => value as V,
): (value: T, usage: string) => V {
  return (value, usage) => callback([...value] as MutableArray<T>, usage);
}
