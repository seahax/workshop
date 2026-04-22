# @seahax/elemental

Helpers for creating UX with without a rendering framework, using only JS, the DOM, and custom elements.

High Level API:
- `default`,`render`,`h`,: DOM node create/update helper.
- `createBinding`: DOM element property/events handling helper.
- `createStore`: Observable state helper.
- `createComponent`: Component creation helper.
- `createMemo`: Component reuse helper.
- `registerComponents`: Component custom element registration helper.

## Render an element

```ts
import { h } from '@seahax/elemental';

const div: HTMLDivElement = ('div', {
  // Set a property.
  ':id': 'my-id'
  // Set an attribute.
  'class': 'my-classname'
}, [
  // Set children.
  h('p', ['A paragraph child.'])
]);
```

### Update the element

```ts
h(div, {
  // Set a property.
  ':id': 'my-id'
  // Set an attribute.
  'class': 'my-classname'
  // Delete an attribute.
  'name': null,
  // Attributes that are not present (or have an undefined value) are
  // left unchanged.
}, [
  // Set children (replaces all previous children).
  h('p', ['A paragraph child.'])
]);
```

## Bind an element

```ts
import { createBinding } from '@seahax/elemental';

const checkbox = h('input', { type: 'checkbox' });

const subscription = createBinding(
  // Element to bind to.
  checkbox,
  // Events to listen to.
  ['input'],
  // Property to watch.
  'checked',
  // Update handler.
  (newValue, oldValue) => {
    // Called immediately on binding, and any time one of the events
    // (eg. "input") is emitted and the property (eg. "checked") is
    // different from the last time the handler was called.
  },
);

// Access the value of the element property through the subscription.
subscription.value;

// Set the value of the element property through the subscription.
// Does not trigger the update handler, because no events are emitted.
// This is equivalent to `input.checked = true`.
subscription.value = true
```

See the [Manage a subscription](#manage-a-subscription) section for info about the returned subscription.

## Create a store

```ts
import { createStore } from '@seahax/elemental';

interface State {
  readonly hideDone: boolean;
  readonly todoItems: readonly {
    readonly id: string;
    readonly text: string;
    readonly done: boolean;
  }[];
}

const store = createStore<State>({
  // Initial state.
  hideDone: false,
  todoItems: [],
});
```

### Update the store

```ts
function setTodoText(
  state: State,
  id: string,
  text: string
): State | undefined {
  const index = state.todoItems.findIndex((item) => item.id === id);
  const item = state.todoItems[index]

  if (!item) {
    // Not found, so leave the current state alone.
    return;
  }

  // Never mutate the current state. Create a new state with changes.
  // (ie. copy on write).
  return {
    ...state,
    todoItems: state.todoItems.splice(index, 1, {
      ...item,
      text,
    })
  };
}

store.update(setTodoText, 'some-todo-id', 'New todo text');
```

### Subscribe to store changes

```ts
import type { StoreSelector } from '@seahax/elemental';

function selectTodo(getId: () => string): StoreSelector<State, [
  text: string | null,
  done: boolean
]> {
  return (state) => {
    const id = getId();
    const index = state.todoItems.findIndex((item) => item.id === id);
    const item = state.todoItems[index];

    if (!item) {
      return [null, false];
    }

    return [item.text, item.done];
  };
}

const subscription = store.subscribe(
  // Selector that returns state sub-values to watch.
  selectTodo(() => 'some-todo-id'),
  // Update handler.
  (text, done) => {
    // Called immediately on subscribe, and any time one of the selected
    // values is updated.
  },
  // Options.
  {
    // If true (default), automatically connect the subscription.
    connect: true,
    // If true (default), call the update handler on connection.
    immediate: true,
  },
);
```

See the [Manage a subscription](#manage-a-subscription) section for info about the returned subscription.

## Manage a subscription.

```ts
// Removes all references to the subscription from the store, so there is
// no possibility of a memory leak. No-op if already disconnected.
subscription.disconnect();

// Connect (or reconnect) a disconnected subscription. No-op if already
// connected.
subscription.connect();

// Returns true if the subscription is currently connected.
subscription.connected();

// Rerun the subscription logic, regardless of whether it is connected.
// The selector will always be called, and the update handler will be
// called if the selector returns a new value.
subscription.refresh();
```

## Render memoized elements

```ts
import { createMemo, h } from '@seahax/elemental';

// Create a memoized element renderer.
//
// NOTE: This would normally be used in a component init function because
// it has internal state that shouldn't be shared between components.
const memo = createMemo<{ id: string, text: string }, HTMLDivElement>(
  (input) => input.id,
  (input, cachedDiv) => {
    return h(cachedDiv ?? 'div', [data.text])
  },
);

// Render two new elements (The cache is empty on the first call).
let elements = memo([
  { id: '1', text: 'Get eggs' },
  { id: '2', text: 'Profit!' },
]);

// Reorder the elements without re-creating them.
elements = memo([
  { id: '2', text: 'Profit!' },
  { id: '1', text: 'Get eggs' },
]);

// Reorder the elements again, and also update their texts, still reusing
// the same two elements.
elements = memo([
  { id: '1', text: 'Get tuna' },
  { id: '2', text: 'Make a sandwich' },
]);

// Add a new element, still reusing the original two elements.
elements = memo([
  { id: '1', text: 'Get tuna' },
  { id: '2', text: 'Make a sandwich' },
  { id: '3', text: 'Please' },
])
```

Primarily intended for repeating sets of inputs (eg. an editable list) where recreating elements unnecessarily could cause them to lose focus. Should generally not be used for performance improvement or when there are a finite set of inputs that can just be saved and updated directly.

## Create a component

```ts
import { createComponent, h } from '@seahax/elemental';

const STYLE = /* css */ `...`;

const todoItem = createComponent('todo-item', (shadow, host) => {
  // Called the first time the component is connected to the document.

  // Render to the shadow root.
  h(shadow, [
    // Styles need to be included inside the shadow root.
    h('style', [STYLE]),
  ]);

  return {
    onConnect() {
      // Called when the component is connected to the document.
    },
    onAttribute(name, newValue, oldValue) {
      // Called when an attribute is set/removed.
    },
    onChild(type, node, previousSibling, nextSibling) {
      // Called when a child node is added/removed (type = 'add' | 'remove').
    },
    onMove() {
      // Component parent changed from one element to another.
    },
    onAdopt() {
      // Component was moved to a different document.
    },
    onDisconnect() {
      // Component was removed from the document.
    }
  }
}, {
  // Limit the `onAttribute` hook to specific attribute names. If not
  // set, all attribute changes will be observed.
  observeAttributes: [TODO_ID_ATTRIBUTE],
  // Set the shadow DOM mode. Defaults to 'open'.
  shadowMode: 'open',
  // Define new custom properties on the host element.
  customProperties: {
    // The callback is used to generate the default property value until
    // the property is set.
    myProperty: (host) => host.getAttribute('my-property'),
  }
});
```

### Register components

```ts
import { registerComponents } from '@seahax/elemental';

registerComponents([myComponent], {
  // Register components to a specific registry. Defaults to
  // `window.customElements`.
  registry: customElements
})
```