# @seahax/store

Basically Zustand, but even simpler, and without the React dependency.

## Create a store

First, define the state type ahead of time.

```ts
interface State {
  readonly bears: number;
  getBearPairs(): number;
  increasePopulation(): void;
  removeAllBears(): void;
}
```

Then, create a store for the state.

```ts
import { createStore } from '@seahax/store';

const bearStore = createStore<State>((set, get) => ({
  bears: 0,
  getBearPairs: () => Math.trunc(get().bears / 2),
  increasePopulation: () => set((state) => ({ bears: state.bears + 1 })),
  removeAllBears: () => set({ bears: 0 }),
}));
```

Unfortunately, TypeScript can't infer the state type, because the `set` and `get` functions make the type inference circular.

## Get the current state

```ts
bearStore.state;
```

## Subscribe to all state changes

```ts
const unsubscribe = bearStore.subscribe((state) => {
  console.log('State:', state);
});

// Remove the listener.
unsubscribe();
```

## Subscribe to a part of the state using a selector

```ts
const unsubscribe = bearStore.subscribe(
  // Listener
  (bears) => console.log('Bears:', bears),
  // Selector
  (state) => state.bears,
);
```

## Subscribe to multiple parts of the state with shallow selection comparison

```ts
const unsubscribe = bearStore.subscribe(
  // Listener
  ({ bears, bearPairs }) => {
    console.log('Bears:', bears);
    console.log('Bear pairs:', bearPairs);
  },
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

Without the `shallow` option, a selector that returns an object will always trigger the listener, because the object reference changes every time.

Shallow selection comparing also supports array, `Set`, and `Map` values.
