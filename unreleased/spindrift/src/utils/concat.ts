export function concat<T>(...values: readonly T[][]): T[] {
  return values.flat();
}
