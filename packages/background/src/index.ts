declare const console: { error(...data: unknown[]): void } | undefined;

type Background<TArgs extends unknown[]> = (task: () => Promise<void>, ...args: TArgs) => BackgroundTask;

export interface BackgroundTask {
  /**
   * Get the current status of the task.
   */
  readonly status: 'pending' | 'resolved' | 'rejected';
  /**
   * Returns a promise that resolves when the task is finished.
   */
  finished(): Promise<'resolved' | 'rejected'>;
}

export function createBackground<TArgs extends unknown[]>(
  errorHandler: (error: unknown, ...args: TArgs) => void | Promise<void>,
): Background<TArgs> {
  return (task, ...args) => {
    let status: BackgroundTask['status'] = 'pending';

    const promise = task()
      .then(() => {
        return status = 'resolved' as const;
      })
      .catch(async (error: unknown) => {
        try {
          await errorHandler(error, ...args);
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
  };
}
