export async function * slice<T>(
  values: Iterable<T> | AsyncIterable<T>,
  length: number,
): AsyncGenerator<T[], void, void> {
  const results: T[] = [];

  for await (const value of values) {
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
