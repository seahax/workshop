import type { ReadonlyRef, Ref } from '../component.ts';
import type { Store } from '../store.ts';
import { useEffect, useRef } from './core.ts';

export function useStore<TState, TValue = TState>(
  store: Store<TState>,
  select: (state: TState) => TValue,
  mutate: (store: Store<TState>, value: TValue) => void,
): Ref<TValue>;
export function useStore<TState, TValue = TState>(
  store: Store<TState>,
  select?: (state: TState) => TValue,
): ReadonlyRef<TValue>;
export function useStore<TState, TValue = TState>(
  store: Store<TState>,
  select: (state: TState) => TValue = (state) => state as unknown as TValue,
  mutate?: (store: Store<TState>, value: TValue) => void,
): Ref<TValue> {
  const ref = useRef(select(store.state), mutate && ((value) => mutate(store, value)));
  useEffect([], () => store.subscribe((state) => (ref.value = select(state))));
  return ref;
}
