export interface SemaphoreOptions {
  readonly capacity?: number;
}

export interface SemaphoreToken {
  /**
   * Release the acquired token. This has no effect if called more than once.
   */
  release(): void;
}

export interface Semaphore extends AbortController {
  /**
   * The number of tokens which are acquired or waiting to be acquired.
   */
  readonly size: number;

  /**
   * The maximum number of tokens which can be acquired simultaneously.
   */
  readonly capacity: number;

  /**
   * The semaphore's abort signal.
   */
  readonly signal: AbortSignal;

  /**
   * Acquire a token, waiting until one is available if necessary.
   */
  acquire(): Promise<SemaphoreToken>;

  /**
   * Abort the semaphore, preventing all future token acquisitions.
   */
  abort(): void;

  /**
   * Wait for all tokens to be released.
   */
  drain(): Promise<void>;

  /**
   * Decorate an async function so that it automatically acquires and releases
   * a token when called.
   */
  controlled<TReturn, TArgs extends any[]>(
    callback: (signal: AbortSignal, ...args: TArgs) => Promise<TReturn>
  ): (...args: TArgs) => Promise<TReturn>;
}

export function createSemaphore({ capacity = 1 }: SemaphoreOptions = {}): Semaphore {
  capacity = Math.max(1, capacity);

  const abortController = new AbortController();
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

    get signal() {
      return abortController.signal;
    },

    async acquire() {
      abortController.signal.throwIfAborted();

      let released = false;

      return await new Promise<SemaphoreToken>((resolve, reject) => {
        if (acquired < capacity) acquire().then(resolve, reject);
        else queue.push(() => void acquire().then(resolve, reject));
      });

      async function acquire(): Promise<SemaphoreToken> {
        abortController.signal.throwIfAborted();

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
          return await callback(this.signal, ...args);
        }
        finally {
          token.release();
        }
      };
    },

    abort(reason?: Error) {
      abortController.abort(reason);
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
