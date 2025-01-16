export async function collect<T>(
  values: Iterable<T | undefined> | AsyncIterable<T | undefined>,
): Promise<T[]> {
  const result: T[] = [];

  for await (const value of values) {
    if (value !== undefined) {
      result.push(value);
    }
  }

  return result;
}
