# @seahax/elemental

Extremely small reactive web components library, containing everything you really need to build anything up to a full reactive application, with only about 3KB overhead (depending on compression, minification, and tree-shaking).

- No Build Tooling
- No Dependencies
- Portable Web Components
- Global & Local Reactivity
- Efficient DOM Rendering
- Functional Hooks
- Routing

## Define A Web Component

```ts
import {
  defineComponent,
  useRef,
  useStore,
  useAttributes,
  useRoute,
  useLoading,
  useEffect,
  h,
} from '@seahax/elemental';

export const MyComponent = defineComponent((shadow) => {
  // This function is run once after the component is created, when it is
  // first connected to the document.

  // Create HTML elements and save references to them.
  const myInput = h('input');

  // Render content to the shadow DOM.
  h(shadow, [
    h('style', [/* css */]),
    h('p', { class: 'hello' }, ['Hello, World!']),
    h('div', { class: 'inputs' }, [
      myInput,
    ]),
  ]);

  // Use reference (reactive state) hooks.
  const localStateRef = useRef('initial value', (newValue) => {
    // Handle
  });
  const globalStateRef = useStore(myStore, select, mutate);
  const [dataValueRef, ...] = useAttributes('data-value', ...);
  const [routeMatchRef, routeStateRef] = useRoute('/path/', {
    match: 'prefix', // 'exact' | 'prefix' | RegExp
    source: 'pathname', // 'pathname' | 'hash'
  });

  // Reactively load async data.
  const loadingStateRef = useLoading([
    // dependency references
  ], async (signal, ...dependencyValues) => {
    // Reactive async code runs when the component is connected to the
    // document, and when any of the dependencies change. The signal is
    // aborted if the dependencies change before the promise returned by
    // this function is resolved.
  });

  // React to reference changes.
  useEffect([
    // dependency references
  ], (...dependencyValues) => {
    // Reactive code runs when the component is connected to the document,
    // and when any of the dependencies change.

    return () => {
      // Cleanup before the next effect callback and after the component
      // is disconnected from the document.
    };
  });
});
```

## Customize The Shadow Root

```ts
const MyComponent = defineComponent(
  (shadow) => {
    // Renderer...
  },
  {
    // Shadow root options.
    shadow: {
      mode: 'closed',
      ...
    }
  }
);
```

## Add Web Component Properties

```ts
interface Props {
  checked: boolean;
}

const MyComponent = defineComponent<Props>(
  (shadow, propRefs) => {
    // Get properties (the ref value is initially undefined).
    const isChecked = propRefs.checked.value ?? shadow.host.hasAttribute('checked');

    // Set properties.
    propRefs.checked.value = true;

    // Alternatively, access the property on the host element.
    const isChecked = shadow.host.checked;
    shadow.host.checked = true;

    // React to property changes.
    useEffect([propRefs.checked], (checked) => {
      ...
    });
  },
  {
    props: {
      // Return a property descriptor that uses a pre-defined ref and the
      // host element. The property descriptor must have a `get` function,
      // `value` is not allowed, and all other properties are optional.
      // The ref value is initially undefined.
      checked: (ref, host) => {
        return {
          get: () => ref.value ?? host.hasAttribute('checked'),
          set: (value) => (ref.value = value),
        };
      },
    },
  }),
);

const element = new MyComponent();

// Properties are defined publicly on element instances.
element.checked = true;
```

## Render Lists With Keyed Elements

```ts
// Create a reusable root element.
const parent = h('div');

h(parent, items.map((item) => {
  // No previous children, so all children will be created.
  return h('p', { 'data-key': item.id }, [item.text]);
}));

// Update children with matching keys.
h(parent, items.map((item) => {
  // Second render, so reuse (and update) children with matching keys.
  return h('p', { 'data-key': item.id }, [item.text]);
}));
```
