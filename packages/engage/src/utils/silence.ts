export async function silence<T>(
  errorNames: readonly string[],
  input: Promise<T> | (() => Promise<T>),
): Promise<T | undefined> {
  try {
    return await (typeof input === 'function' ? input() : input);
  }
  catch (error) {
    if (error instanceof Error && errorNames.includes(error.name)) {
      return undefined;
    }

    throw error;
  }
}
