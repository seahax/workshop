declare const console: {
  error(...data: unknown[]): void;
} | undefined;

type Background<TErrorOptions extends object> = (
  task: () => Promise<void>,
  ...args: {} extends TErrorOptions ? [options?: TErrorOptions] : [options: TErrorOptions]
) => void;

export function createBackground<TErrorOptions extends object = {}>(
  errorHandler: (error: unknown, options: TErrorOptions) => void | Promise<void>,
): Background<TErrorOptions> {
  return (task, options: TErrorOptions = {} as TErrorOptions) => {
    task()
      .catch((error: unknown) => errorHandler(error, options))
      .catch((error: unknown) => console?.error('Error handling background error:', error));
  };
}
