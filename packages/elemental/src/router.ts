import { createStore, type Store } from './store.ts';

export interface RouterState {
  readonly url: string;
  readonly pathname: string;
  readonly hash: string;
  readonly state: unknown;
}

/**
 * Get a router {@link Store} that is updated when the client side route (aka:
 * `History`) changes. This method returns the same store every time it is
 * called (ie. a singleton).
 */
export function getRouter(): Store<RouterState> {
  return (singleton ??= createRouter());
}

let singleton: Store<RouterState> | undefined;

function createRouter(): Store<RouterState> {
  const store = createStore<RouterState>({
    url: window.location.href,
    pathname: window.location.pathname,
    hash: window.location.hash,
    state: window.history.state,
  });

  const onUpdate = (): void => {
    let state = store.state;

    if (state.url !== window.location.href) {
      state = {
        ...state,
        url: window.location.href,
        pathname: window.location.pathname,
        hash: window.location.hash,
      };
    }

    if (state.state !== window.history.state) {
      state = { ...state, state: window.history.state };
    }

    store.state = state;
  };

  Object.defineProperties(
    history,
    Object.fromEntries(
      (['pushState', 'replaceState'] as const).map((method: 'pushState' | 'replaceState') => {
        const original = history[method].bind(history) as History['pushState'] & History['replaceState'];
        const descriptor: PropertyDescriptor = {
          value: (...args: Parameters<typeof original>) => {
            original(...args);
            onUpdate();
          },
          enumerable: true,
          configurable: true,
        };

        return [method, descriptor];
      }),
    ),
  );

  window.addEventListener('popstate', onUpdate);

  return store;
}
