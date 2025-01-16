# @seahax/store-react

React bindings for [@seahax/store](../store).

Okay, _NOW_ it's like Zustand.

## Create React bindings for the store

```ts
import { createStoreContext } from '@seahax/store-react';
import { bearStore } from './bear-store';

export const StoreContext = createStoreContext(bearStore);
export const { useBearStore } = StoreContext;
```

## Use the store in components

```tsx
import { useBearStore } from './bear-store-context';

function BearCounter() {
  const bears = useBearStore((state) => state.bears)
  return <h1>{bears} around here...</h1>
}

function Controls() {
  const increasePopulation = useBearStore((state) => state.increasePopulation)
  return <button onClick={increasePopulation}>one up</button>
}
```

## Use hook selector options

The React hook (eg. `useBearStore` above) is a wrapper around the store `subscribe` method. The store is provided by context, so the first argument is the (optional) selector, and the second argument is the optional select options.

Subscribe to the whole state (ie. no selector).

```tsx
const state = useBearStore();
```

Subscribe to several parts of the state.

```tsx
const { bears, bearPairs } = useBearStore(
  // Selector
  (state) => ({
    bears: state.bears,
    bearPairs: state.getBearPairs(),
  }),
  // Options
  {
    shallow: true
  }
);
```

## Provide the store through context

Providing the store is optional. If there's no parent provider, then the store that was passed to `createStoreReact` is used as the default. But, if you need to provide a different instance of the store, you can do so with the provider.

```tsx
import { createBearStore } from './bear-store';

// Assumes you have created a factory function for creating bear stores.
const oneBearStore = createBearStore();

const App: FC = () => {
  return (
    <BearStoreProvider store={oneBearStore}>
      <MyComponent />
    </BearStoreProvider>
  );
}

const MyComponent: FC = () => {
  const bears = useBearStore((state) => state.bears)
  return <h1>{bears} around here...</h1>
}
```
