import { ArgsError } from './error.js';

type Multiple<T> = T extends any[] ? T : T[];
type Last<T> = T extends [infer I, ...any[]] ? I : T extends (infer I)[] ? I | undefined : T;
type Required<T> = T extends (infer I)[] ? [I, ...I[]] : Exclude<T, undefined>;

export function multiple<T, V = Multiple<T>>(
  callback: (value: Multiple<NoInfer<T>>, usage: string) => V = (value) => value as V,
): (value: T, usage: string) => V {
  return (value, usage) => callback((Array.isArray(value) ? value : [value]) as Multiple<T>, usage);
}

export function last<T, V = Last<T>>(
  callback: (value: Last<NoInfer<T>>, usage: string) => V = (value) => value as V,
): (value: T, usage: string) => V {
  return (value, usage) => callback(Array.isArray(value) ? value.at(-1) : value, usage);
}

export function required<T, V = Required<Last<T>>>(
  callback: (value: Required<NoInfer<T>>, usage: string) => V = last(),
): (value: T, usage: string) => V {
  return (value, usage) => {
    if (value === undefined) throw new ArgsError(`Missing "${usage}".`);
    if (Array.isArray(value) && value.length === 0) throw new ArgsError(`Missing "${usage}".`);
    return callback(value as Required<T>, usage);
  };
};
