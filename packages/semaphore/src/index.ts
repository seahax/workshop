export interface SemaphoreOptions {
  /**
   * A signal that when aborted will prevent the semaphore from issuing more
   * tokens. If the `acquire` method is called or a controlled function is
   * invoked after the signal is aborted, an `AbortError` will be thrown.
   */
  readonly signal?: AbortSignal;

  /**
   * The maximum number of tokens which can be acquired simultaneously.
   */
  readonly capacity?: number;
}

export interface SemaphoreToken {
  /**
   * Release the acquired token. This has no effect if called more than once.
   */
  release(): void;
}

export interface Semaphore {
  /**
   * The number of tokens which are acquired or waiting to be acquired.
   */
  readonly size: number;

  /**
   * The maximum number of tokens which can be acquired simultaneously.
   */
  readonly capacity: number;

  /**
   * Acquire a token, waiting until one is available if necessary.
   */
  acquire(): Promise<SemaphoreToken>;

  /**
   * Wait for all tokens to be released.
   */
  drain(): Promise<void>;

  /**
   * Decorate an async function so that it automatically acquires and releases
   * a token when called.
   */
  controlled<TReturn, TArgs extends any[]>(
    callback: (...args: TArgs) => Promise<TReturn>
  ): (...args: TArgs) => Promise<TReturn>;
}

export function createSemaphore({
  signal,
  capacity = 1,
}: SemaphoreOptions = {}): Semaphore {
  capacity = Math.max(1, capacity);

  const onDrain: (() => void)[] = [];
  const queue: (() => void)[] = [];
  let acquired = 0;

  return {
    get size() {
      return getSize();
    },

    get capacity() {
      return capacity;
    },

    async acquire() {
      signal?.throwIfAborted();

      let released = false;

      return await new Promise<SemaphoreToken>((resolve, reject) => {
        if (acquired < capacity) acquire().then(resolve, reject);
        else queue.push(() => void acquire().then(resolve, reject));
      });

      async function acquire(): Promise<SemaphoreToken> {
        signal?.throwIfAborted();

        ++acquired;

        return { release };
      }

      function release(): void {
        if (released) return;

        released = true;
        --acquired;

        while (acquired < capacity && queue.length > 0) {
          queue.shift()?.();
        }

        while (getSize() === 0 && onDrain.length > 0) {
          onDrain.shift()?.();
        }
      }
    },

    controlled(callback) {
      return async (...args) => {
        const token = await this.acquire();

        try {
          return await callback(...args);
        }
        finally {
          token.release();
        }
      };
    },

    async drain() {
      return this.size > 0
        ? await new Promise((callback) => onDrain.push(callback))
        : undefined;
    },
  };

  function getSize(): number {
    return acquired + queue.length;
  }
}
