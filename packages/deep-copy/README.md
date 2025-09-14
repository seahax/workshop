# @seahax/semaphore

Make a recursive deep copy, treating functions and class instances as atomic values.

```ts
import deepCopy from '@seahax/deep-copy';

const copy = deepCopy({
  foo: 123,
  bar: () => console.log('hello world'),
  baz: new Date(),
});
```
