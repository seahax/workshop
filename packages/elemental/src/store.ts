export interface Store<TState> {
  state: TState;
  subscribe: (callback: (state: TState) => void) => (() => void);
}

export function createStore<TState>(initialState: TState): Store<TState> {
  const events = new EventTarget();
  let state = initialState;

  return {
    get state() {
      return state;
    },
    set state(newState) {
      if (newState === state) return;
      state = newState;
      events.dispatchEvent(new Event('change'));
    },
    subscribe(callback) {
      const listener = (): void => callback(state);
      events.addEventListener('change', listener);
      return () => events.removeEventListener('change', listener);
    },
  };
}
