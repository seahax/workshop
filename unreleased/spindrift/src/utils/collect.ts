export async function collect<T>(
  values:
    | Iterable<T | undefined>
    | AsyncIterable<T | undefined>
    | Promise<
      | Iterable<T | undefined>
      | AsyncIterable<T | undefined>
    >
    | (
      () =>
        | Iterable<T | undefined>
        | AsyncIterable<T | undefined>
        | Promise<
          | Iterable<T | undefined>
          | AsyncIterable<T | undefined>
        >
      ),
): Promise<T[]> {
  const result: T[] = [];

  for await (const value of await (typeof values === 'function' ? values() : values)) {
    if (value !== undefined) {
      result.push(value);
    }
  }

  return result;
}
