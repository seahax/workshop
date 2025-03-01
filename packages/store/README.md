# @seahax/store

Really simple Redux-like store.

## Getting Started

Define the state type. The state type should be immutable.

```ts
interface MyState {
  readonly count: number;
}
```

Create actions. The `createActions` utility accepts a map of action payload
factories, where the keys are the action types, and the return values are the
action payloads. The payload factories should be pure functions without any
side effects. The returned payloads should be immutable.

```ts
import { createActions } from '@seahax/store';

const actions = createActions({
  add: (value: number) => ({ value } as const),
  subtract: (value: number) => ({ value } as const),
});
```

Infer the action type from your actions. This is a union of `Action<TType, TPayload>` types. An `Action<TType, TPayload>` is an object with a `type: TType` property and a `payload: TPayload` property.

```ts
import { type InferActionType } from '@seahax/store';

type MyAction = InferActionType<typeof actions>;
```

Define one or more reducers. The state should be immutable, so reducers must
create a new state instead of modifying the existing state. The `action` is an
object with `type` and `payload` properties. Reducers should be pure functions without any side effects.

```ts
function reducer(state: MyState, action: MyAction): MyState {
  switch (action.type) {
    case 'add':
      return { count: state.count + action.payload.value };
    case 'subtract':
      return { count: state.count - action.payload.value };
    default:
      return state;
  }
}
```

Create a store with the state and action types, an initial state value, and the
reducers. The reducers are all run in order each time an action is dispatched.

```ts
const store = createStore<MyState, MyAction>({ count: 0 }, [reducer]);
```

Dispatch actions.

```ts
store.dispatch(actions.add, 1);
store.dispatch(actions.subtract, 2);
```

Subscribe to state changes.

```ts
const subscription = store.subscribe((state) => {
  console.log('State:', state);
});
```

Unsubscribe from state changes.

```ts
subscription.unsubscribe();
```