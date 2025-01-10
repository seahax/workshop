export async function coalesce<T>(
  ...callbacks: (() => Promise<T | null | undefined> | T | null | undefined)[]
): Promise<T | undefined> {
  for (const callback of callbacks) {
    const value = await callback();
    if (value != null) return value;
  }
}
