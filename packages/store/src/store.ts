import { type Action } from './action.ts';
import type { Reducer } from './reducer.ts';

export interface Store<TState, TAction extends Action<string, unknown>> {
  readonly state: TState;
  dispatch(action: TAction): void;
  dispatch<TArgs extends any[]>(action: (...args: TArgs) => TAction, ...args: TArgs): void;
  subscribe(subscriber: (state: TState) => unknown): { unsubscribe: () => void };
};

export function createStore<TState, TAction extends Action<string, unknown>>(
  initialState: TState,
  reducers: readonly Reducer<TState, TAction>[],
): Store<TState, TAction> {
  const subscriptions = new Set<() => void>();

  let state = initialState;

  return {
    get state() {
      return state;
    },
    dispatch(action: TAction | ((...args: any[]) => TAction), ...args: any[]) {
      if (typeof action === 'function') {
        action = action(...args);
      }
      state = reducers.reduce((currentState, reducer) => reducer(currentState, action), state);
      subscriptions.forEach((subscription) => subscription());
    },
    subscribe(subscriber) {
      const subscription = (): void => void subscriber(state);
      subscriptions.add(subscription);
      return { unsubscribe: () => void subscriptions.delete(subscription) };
    },
  };
}

export function createStoreFactory<TState, TActions extends Action<string, unknown>>(
  initialStateFactory: () => TState,
  reducers: readonly Reducer<TState, TActions>[],
): () => Store<TState, TActions> {
  return () => createStore(initialStateFactory(), reducers);
}
