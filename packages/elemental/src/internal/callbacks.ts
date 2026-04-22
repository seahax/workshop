export interface CallbackList {
  readonly push: (callback: (() => void) | void) => this;
  readonly run: () => this;
  readonly clear: () => this;
}

export function createCallbacks(): CallbackList {
  let callbacks: readonly (() => void)[] = [];

  const self: CallbackList = {
    push(callback) {
      if (callback) callbacks = [...callbacks, callback];
      return self;
    },
    run() {
      callbacks.forEach((callback) => {
        try {
          callback();
        }
        catch (error: unknown) {
          void Promise.reject(error instanceof Error
            ? error
            : new Error('unhandled callback error', { cause: error }));
        }
      });

      return self;
    },
    clear() {
      callbacks = [];
      return self;
    },
  };

  return self;
}
