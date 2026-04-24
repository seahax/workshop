import { createStore, type Store } from './store.ts';

export type Router = Store<RouterState>;

export interface RouterState {
  readonly url: string;
  readonly state: unknown;
}

export function getRouter(): Router {
  return (singleton ??= createRouter());
}

let singleton: Router | undefined;

function createRouter(): Router {
  const store = createStore({
    url: window.location.href,
    state: window.history.state,
  });

  const onUpdate = (): void => {
    let state = store.state;
    if (state.url !== window.location.href) state = { ...state, url: window.location.href };
    if (state.state !== window.history.state) state = { ...state, state: window.history.state };
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
