export async function collect<T>(values: Iterable<T> | AsyncIterable<T>): Promise<T[]> {
  const result: T[] = [];

  for await (const value of values) {
    if (value as T | undefined === undefined) {
      result.length += 1;
    }
    else {
      result.push(value);
    }
  }

  return result;
}
