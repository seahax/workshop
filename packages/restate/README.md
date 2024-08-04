# @seahax/restate

Redux-like state management.

A solution looking for a problem. It's cool I guess, if you're into that sort of thing.

## Overview

First, these are the key characteristics of a Redux-like state management system:

- States are immutable (replace only).
- Actions (and thunks) are dispatched (like events).
- Reducers [replace the immutable state](https://redux.js.org/tutorials/fundamentals/part-3-state-actions-reducers#rules-of-reducers) as a result of dispatched actions.
- Stores manage the state, receive actions, and invoke a reducer.

## Usage

Create a store. The store accepts two type parameters: the actions map and the state. The store also requires one argument: the reducer function for updating the state based on dispatched actions. The reducer function must provide the default (aka: initial) state.

```ts
import { Action, State, Store } from '@seahax/restate';

// Define the union of actions using the `Action` helper type.
type AppAction =
  | Action<'increment', number>
  | Action<'decrement', number>
;

// Define the state shape using the `State` helper type.
type AppState = State<{
  count: number;
}>;

// Define the initial state.
const INITIAL_STATE: AppState = {
  count: 0;
};

// Define a reducer function.
function reducer(action: AppAction, state: AppState): AppState {
  switch (action.type) {
    case 'increment':
      return { count: state.count + action.payload };
    case 'decrement':
      return { count: state.count - action.payload };
    default:
      return state;
  }
}

// Create the store instance.
const appStore = new Store(INITIAL_STATE, reducer);
```

Read the store `state` at any time. It is readonly and immutable.

```ts
appStore.state; // { count: 0 }
```

Use selectors to derive values from the state. You should always prefer selectors over directly accessing the state for two reasons:

1. Selectors can be memoized (using 3rd party tools) if optimization is needed.
2. Selectors are declarative which decouples consumers from the state shape.

```ts
const selectCount = (state: AppState): number => state.count;

const count = selectCount(appStore.state); // 0
```

Dispatch actions to cause the reducer to update the state.

```ts
appStore.dispatch({ type: 'increment', payload: 3 });
appStore.dispatch({ type: 'decrement', payload: 1 });

const count = selectCount(appStore.state); // 2
```

Dispatching can also be done with "thunks", which are just functions that dispatch one or more actions as part of an asynchronous flow. Getting the state and dispatching actions can be done any number of times in a single thunk dispatch.

```ts
import { createThunk } from '@seahax/restate';

const incrementThunk = createThunk<AppAction, AppState>((dispatch, getState) => {
  const count = selectCount(getState());
  const amount = await getIncrementAmount(currentCount);
  dispatch({ type: 'increment', payload: amount });
});

appStore.dispatch(incrementThunk);
```

Stores are [evented](../evented/README.md).

```ts
appStore.on('dispatch', (action) => {
  // Receive the dispatched action. Called before the reducer is invoked.
});

appStore.on('reduce', (state, previousState, action) => {
  // Receive the new state, the previous state, and the action responsible for 
  // the change. Called after the reducer is invoked.
});

appStore.on('error', (error) => {
  // Receive any errors thrown by asynchronous thunks. If this event is not
  // handled, the error will be thrown.
});
```
