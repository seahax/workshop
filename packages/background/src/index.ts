declare const console: { error(...data: unknown[]): void } | undefined;

type BackgroundFunction<TArgs extends unknown[]> = (task: () => Promise<void>, ...args: TArgs) => BackgroundTask;

interface BackgroundProperties<TArgs extends unknown[]> {
  /**
   * Add a callback to be invoked when the task begins.
   */
  onBegin(callback: BackgroundCallback<TArgs>): this;

  /**
   * Add a callback to be invoked when the task succeeds.
   */
  onSuccess(callback: BackgroundCallback<TArgs>): this;
}

export type Background<TArgs extends unknown[]> = BackgroundFunction<TArgs> & BackgroundProperties<TArgs>;

export interface BackgroundTask {
  /**
   * Get the current status of the task.
   */
  readonly status: BackgroundTaskStatus;

  /**
   * Returns a promise that resolves when the task is finished.
   */
  finished(): Promise<'resolved' | 'rejected'>;
}

export type BackgroundTaskStatus = 'pending' | 'resolved' | 'rejected';
export type BackgroundCallback<TArgs extends unknown[]> = (...args: TArgs) => void | Promise<void>;
export type BackgroundErrorHandler<TArgs extends unknown[]> = (error: unknown, ...args: TArgs) => void | Promise<void>;

export function createBackground<TArgs extends unknown[] = []>(
  onError: BackgroundErrorHandler<TArgs>,
): Background<TArgs> {
  const onBeginCallbacks: BackgroundCallback<TArgs>[] = [];
  const onSuccessCallbacks: BackgroundCallback<TArgs>[] = [];
  const self: Background<TArgs> = Object.assign<BackgroundFunction<TArgs>, BackgroundProperties<TArgs>>(
    (task, ...args) => {
      let status: BackgroundTaskStatus = 'pending';

      const promise = Promise.resolve()
        .then(async () => {
          for (const onBegin of onBeginCallbacks) {
            await onBegin(...args);
          }

          await task();

          for (const onSuccess of onSuccessCallbacks) {
            await onSuccess(...args);
          }

          return status = 'resolved' as const;
        })
        .catch(async (error: unknown) => {
          try {
            await onError(error, ...args);
          }
          catch (error) {
            console?.error('Error handling background error:', error);
          }

          return status = 'rejected' as const;
        });

      return {
        get status() {
          return status;
        },
        async finished() {
          return await promise;
        },
      };
    }, {
      onBegin(callback) {
        onBeginCallbacks.push(callback);
        return self;
      },
      onSuccess(callback) {
        onSuccessCallbacks.push(callback);
        return self;
      },
    },
  );

  return self;
}
