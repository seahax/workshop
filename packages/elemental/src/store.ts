import { createCallbacks } from './internal/callbacks.ts';

export interface Store<TState> {
  state: TState;
  subscribe: (callback: (state: TState) => void) => () => void;
}

/** */
export function createStore<TState>(initialState: TState): Store<TState> {
  const callbacks = createCallbacks();
  let state = initialState;

  return {
    get state() {
      return state;
    },
    set state(newState) {
      if (newState === state) return;
      state = newState;
      callbacks.run();
    },
    subscribe: (callback) => callbacks.push(() => callback(state)),
  };
}
