export function lazy<T>(fn: () => T): () => T {
  let value: { readonly current: T } | undefined;

  return (): T => {
    if (!value) {
      value = { current: fn() };
    }

    return value.current;
  };
}
