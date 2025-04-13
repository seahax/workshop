declare const console: { error(...data: unknown[]): void } | undefined;

type Background<TArgs extends unknown[]> = (task: () => Promise<void>, ...args: TArgs) => void;

export function createBackground<TArgs extends unknown[]>(
  errorHandler: (error: unknown, ...args: TArgs) => void | Promise<void>,
): Background<TArgs> {
  return (task, ...args) => {
    task()
      .catch((error: unknown) => errorHandler(error, ...args))
      .catch((error: unknown) => console?.error('Error handling background error:', error));
  };
}
