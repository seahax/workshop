import os from 'node:os';

const CONCURRENCY = Math.min(20, os.cpus().length + 1);

export async function * map<T, V>(
  values: Iterable<T> | AsyncIterable<T>,
  task: (value: T) => Promise<V>,
): AsyncGenerator<V, void, void> {
  const results: V[] = [];
  const queue = new Set<Promise<any>>();

  for await (const value of values) {
    while (queue.size >= CONCURRENCY) {
      await Promise.race(queue);
    }

    yield * results;
    results.length = 0;

    const promise = task(value).then((result) => results.push(result));
    queue.add(promise);
    void promise.finally(() => queue.delete(promise));
  }

  await Promise.all(queue);
  yield * results;
}
