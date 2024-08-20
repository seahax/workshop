# @seahax/evented

Add typed events to classes.

Pub/sub if you're nasty.

```ts
class MyClass extends Evented<{
  event0: (arg0: string, arg1: number) => void,
  event1: (arg0: boolean, arg1: bigint) => void
}> { ... }

const instance = new MyClass();
const off0 = instance.on('event0', (arg0, arg1) => { ... });
const off1 = instance.once('event1', (arg0, arg1) => { ... });

instance.emit('event0', 'Hello, world!', 42);
instance.emit('event1', true, 9007199254740991n);

off0();
```
