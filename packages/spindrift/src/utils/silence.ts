export async function silence<T>(
  errorTypes: readonly (new (...args: any) => Error)[],
  input: Promise<T> | (() => Promise<T>),
): Promise<T | undefined> {
  try {
    return await (typeof input === 'function' ? input() : input);
  }
  catch (error) {
    if (errorTypes.some((errorType) => error instanceof errorType)) {
      return undefined;
    }

    throw error;
  }
}
