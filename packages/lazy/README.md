# @seahax/lazy

Lazy initialization of a value.

## Example

wrap an inner no-argument function so that it is only called once the first time the outer wrapper is called.

```ts
const uuid = lazy(randomUUID);
uuid() === uuid(); // true (randomUUID is only called once)
```
