export function assert<T>(value: T, message: string): asserts value is Exclude<T, null | undefined | 0 | 0n | false> {
  if (!value) {
    throw new Error(message);
  }
}
