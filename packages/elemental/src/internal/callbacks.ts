export interface Callbacks {
  readonly push: (callback: () => void) => () => void;
  readonly run: (options?: { readonly clear?: boolean }) => void;
  readonly clear: () => void;
}

export function createCallbacks(): Callbacks {
  const callbacks = new Set<() => void>();

  const self: Callbacks = {
    push: (callback) => {
      callbacks.add(callback);
      return () => callbacks.delete(callback);
    },
    run: ({ clear = false } = {}) => {
      const errors: unknown[] = [];
      const callbacksCopy = [...callbacks];

      for (const callback of callbacksCopy) {
        try {
          callback();
        } catch (error: unknown) {
          errors.push(error);
        }
      }

      if (clear) callbacks.clear();
      if (errors.length > 0) throw new AggregateError(errors);
      return self;
    },
    clear: () => callbacks.clear(),
  };

  return self;
}
