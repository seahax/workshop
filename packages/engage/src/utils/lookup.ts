import { minimatch } from 'minimatch';

export function lookup<T>(config: Readonly<Record<string, T>>): (value: string) => T | undefined {
  const entries = Object.entries(config);

  return (value) => {
    if (!value.startsWith('/')) value = `/${value}`;

    for (const [pattern, result] of entries) {
      if (minimatch(value, pattern, { dot: true, matchBase: true, nocomment: true })) {
        return result;
      }
    }
  };
}
