# @seahax/evented

Add typed events to classes.

Pub/sub is the pub food of algorithms. It's basic, but satisfying, and in some cases it can get weirdly fancy.

## Usage

Extend the `Evented` type.

```ts
import { Evented } from '@seahax/evented';

interface MyClassEvents {
  message: (value: string) => void;
}

class MyClass extends Evented<MyClassEvents> {
  ...
}
```

Add a listener. The `on` method returns a function that removes the listener when called.

```ts
const instance = new MyClass();
const off = instance.on('message', (value) => {
  ...
});

// Remove the listener by calling the returned function.
off();
```

Add a listener that will only be called once. The listener will be automatically removed when the next event is received.

```ts
instance.on('message', (value) => {
  console.log(value);
}, { once: true });
```

Emit an event. The `emit` method returns `true` if there are listeners for the event, or `false` if there are no listeners.

```ts
if (!instance.emit('Hello, world!')) {
  console.error('No listeners for message event');
}
```
