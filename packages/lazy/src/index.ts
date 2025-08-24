export interface Lazy<T> {
  (key?: WeakKey): T;
  isCalled(key?: WeakKey): boolean;
  reset(key?: WeakKey): void;
}

const DEFAULT_KEY = Symbol();

export function lazy<T>(init: (key?: WeakKey) => T): Lazy<T> {
  const cache = new WeakMap<WeakKey, { readonly value: T }>();

  return Object.assign((key?: WeakKey) => {
    let entry = cache.get(key ?? DEFAULT_KEY);

    if (!entry) {
      entry = { value: init(key) };
      cache.set(key ?? DEFAULT_KEY, entry);
    }

    return entry.value;
  }, {
    isCalled: (key = DEFAULT_KEY) => cache.has(key),
    reset: (key = DEFAULT_KEY) => cache.delete(key),
  });
}
