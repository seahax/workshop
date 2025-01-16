export async function * slice<T>(
  values: Iterable<T> | AsyncIterable<T> | Promise<Iterable<T> | AsyncIterable<T>> | (
    () => Iterable<T> | AsyncIterable<T> | Promise<Iterable<T> | AsyncIterable<T>>
  ),
  length: number,
): AsyncGenerator<T[], void, void> {
  const results: T[] = [];

  for await (const value of await (typeof values === 'function' ? values() : values)) {
    results.push(value);

    if (results.length >= length) {
      yield [...results];
      results.length = 0;
    }
  }

  if (results.length > 0) {
    yield results;
  }
}
