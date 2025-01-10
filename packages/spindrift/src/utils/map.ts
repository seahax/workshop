import os from 'node:os';

const DEFAULT_CONCURRENCY = Math.min(20, os.cpus().length + 1);

export async function * map<T, V>(
  values: Iterable<T> | AsyncIterable<T> | Promise<Iterable<T> | AsyncIterable<T>> | (
    () => Iterable<T> | AsyncIterable<T> | Promise<Iterable<T> | AsyncIterable<T>>
  ),
  task: (value: T) => Promise<V | readonly V[] | undefined>,
  { concurrency = DEFAULT_CONCURRENCY }: {
    readonly concurrency?: number;
  } = {},
): AsyncGenerator<V, void, void> {
  const results: V[] = [];
  const queue = new Set<Promise<any>>();

  try {
    for await (const value of await (typeof values === 'function' ? values() : values)) {
      while (queue.size >= concurrency) {
        await Promise.race(queue);
      }

      yield * results;
      results.length = 0;

      const promise = task(value).then((result) => {
        if (result !== undefined) {
          results.push(...(Array.isArray(result) ? result : [result]));
        }
      });

      queue.add(promise);
      void promise.finally(() => queue.delete(promise));
    }

    await Promise.all(queue);
    yield * results;
  }
  finally {
    await Promise.allSettled(queue);
  }
}
