export function initializer<T>(fn: () => T): () => T {
  let result: { readonly value: T } | undefined;

  return () => {
    if (!result) result = { value: fn() };
    return result.value;
  };
}
