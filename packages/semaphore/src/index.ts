export interface Semaphore<TOwner> {
  /**
   * The number of locks which are acquired or waiting to be acquired.
   */
  readonly size: number;

  /**
   * The maximum number of locks which can be acquired simultaneously.
   */
  readonly capacity: number;

  /**
   * Acquire a lock, waiting until one is available if necessary.
   */
  acquire(owner: TOwner): Promise<Lock>;

  /**
   * Wait for all locks to be released.
   */
  drain(): Promise<void>;

  /**
   * Decorate an async function so that it automatically acquires and releases
   * a lock when called.
   */
  controlled<TReturn, TArgs extends any[]>(
    callback: (...args: TArgs) => Promise<TReturn>,
    owner: TOwner,
  ): (...args: TArgs) => Promise<TReturn>;
}

export interface SemaphoreOptions<TOwner> {
  /**
   * A signal that when aborted will prevent the semaphore from issuing more
   * locks. If the `acquire` method is called or a controlled function is
   * invoked after the signal is aborted, an `AbortError` will be thrown.
   */
  readonly signal?: AbortSignal;

  /**
   * The maximum number of locks which can be acquired simultaneously.
   */
  readonly capacity?: number;

  /**
   * A callback invoked when a lock is acquired or released.
   */
  readonly onAcquire?: (owner: TOwner) => void;

  /**
   * A callback invoked when a lock is released.
   */
  readonly onRelease?: (owner: TOwner) => void;
}

export interface Mutex<TOwner> extends Semaphore<TOwner> {
  readonly capacity: 1;
}

export interface MutexOptions<TOwner> extends Omit<SemaphoreOptions<TOwner>, 'capacity'> {}

export interface Lock {
  /**
   * True if the lock has not been released yet.
   */
  readonly active: boolean;

  /**
   * Release the acquired lock. This has no effect if called more than once.
   */
  release(): void;
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

      return await new Promise<Lock>((resolve, reject) => {
        if (acquired < capacity) acquire().then(resolve, reject);
        else queue.push(() => void acquire().then(resolve, reject));
      });

      async function acquire(): Promise<Lock> {
        signal?.throwIfAborted();

        ++acquired;

        try {
          onAcquire?.(owner);
        }
        catch (error: unknown) {
          release();
          throw error;
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
        const lock = await this.acquire(owner);

        try {
          return await callback(...args);
        }
        finally {
          lock.release();
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

export function createMutex<TOwner = void>(options: MutexOptions<TOwner> = {}): Mutex<TOwner> {
  return createSemaphore<TOwner>({ ...options, capacity: 1 }) as Mutex<TOwner>;
}
