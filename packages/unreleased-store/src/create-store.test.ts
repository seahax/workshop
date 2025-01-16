import { beforeEach, describe, expect, test } from 'vitest';

import { createStore } from './create-store.js';
import { type Store } from './types/store.js';

interface State {
  value: number;
  increment(): void;
  reset(): void;
  double(): number;
}

describe('createStore', () => {
  let store: Store<State>;

  beforeEach(() => {
    store = createStore<State>((set, get) => ({
      value: 0,
      increment: () => set((state) => ({ value: state.value + 1 })),
      reset: () => set(() => ({ value: 0 })),
      double: () => get().value * 2,
    }));
  });

  test('use a store', () => {
    expect(store.state.value).toBe(0);
    expect(store.state.double()).toBe(0);

    store.state.increment();
    store.state.increment();
    expect(store.state.value).toBe(2);
    expect(store.state.double()).toBe(4);

    store.state.reset();
    expect(store.state.value).toBe(0);
    expect(store.state.double()).toBe(0);
  });

  test('subscribe to a store', () => {
    let updated: State | undefined;
    const unsubscribe = store.subscribe((state) => (updated = state));

    expect(updated).toBeUndefined();

    store.state.increment();
    expect(updated).toBe(store.state);

    unsubscribe();
    store.state.increment();
    expect(updated).not.toBe(store.state);
    expect(updated?.value).toBe(1);
  });
});
