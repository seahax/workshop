export function lazy<T>(init: () => T): () => T;
export function lazy<T>(init: (() => T) | { readonly value: T }): () => T {
  return () => {
    if (typeof init === 'function') {
      init = { value: init() };
    }

    return init.value;
  };
}
