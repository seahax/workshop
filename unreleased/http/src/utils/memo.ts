export interface Memo<T> {
  (): T;
  readonly state: MemoState<T>;
}

export type MemoState<T> = {
  readonly called: false;
  readonly value: undefined;
} | {
  readonly called: true;
  readonly value: T;
};

/**
 * Wrap a no-argument function so that it is only called once. After the first
 * call, the returned value is cached and returned on subsequent calls, without
 * invoking the inner function again.
 *
 * If an error is thrown synchronously, the result is not cached. If an error
 * is thrown asynchronously (ie. a rejected promise), the promise _IS_ cached.
 */
export function memo<T>(fn: () => T): Memo<T> {
  let state: MemoState<T> = { called: false, value: undefined };

  return Object.defineProperties(() => {
    if (!state.called) {
      state = { called: true, value: fn() };
    }

    return state.value;
  }, {
    state: { get: () => state, configurable: true, enumerable: true },
  }) as Memo<T>;
}
