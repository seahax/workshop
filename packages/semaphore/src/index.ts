export interface SemaphoreOptions<TOwner> {
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

  /**
   * A callback invoked when a token is acquired or released.
   */
  readonly onAcquire?: (owner: TOwner) => void;

  /**
   * A callback invoked when a token is released.
   */
  readonly onRelease?: (owner: TOwner) => void;
}

export interface SemaphoreToken {
  /**
   * True if the token has not been released yet.
   */
  readonly active: boolean;

  /**
   * Release the acquired token. This has no effect if called more than once.
   */
  release(): void;
}

export interface Semaphore<TOwner> {
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
  acquire(owner: TOwner): Promise<SemaphoreToken>;

  /**
   * Wait for all tokens to be released.
   */
  drain(): Promise<void>;

  /**
   * Decorate an async function so that it automatically acquires and releases
   * a token when called.
   */
  controlled<TReturn, TArgs extends any[]>(
    callback: (...args: TArgs) => Promise<TReturn>,
    owner: TOwner,
  ): (...args: TArgs) => Promise<TReturn>;
}

export function createSemaphore<TOwner = void>({
  signal,
  capacity = 1,
  onAcquire,
  onRelease,
}: SemaphoreOptions<TOwner> = {}): Semaphore<TOwner> {
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

    async acquire(owner) {
      signal?.throwIfAborted();

      let active = true;

      return await new Promise<SemaphoreToken>((resolve, reject) => {
        if (acquired < capacity) acquire().then(resolve, reject);
        else queue.push(() => void acquire().then(resolve, reject));
      });

      async function acquire(): Promise<SemaphoreToken> {
        signal?.throwIfAborted();

        ++acquired;

        try {
          onAcquire?.(owner);
        }
        finally {
          release();
        }

        return {
          get active() { return active; },
          release,
        };
      }

      function release(): void {
        if (!active) return;

        active = false;
        --acquired;

        try {
          onRelease?.(owner);
        }
        finally {
          while (acquired < capacity && queue.length > 0) {
            queue.shift()?.();
          }

          while (getSize() === 0 && onDrain.length > 0) {
            onDrain.shift()?.();
          }
        }
      }
    },

    controlled(callback, owner: TOwner) {
      return async (...args) => {
        const token = await this.acquire(owner);

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
