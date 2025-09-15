/**
 * Wrap a zero argument (idempotent) getter so that the return value is only
 * computed once.
 */
export function lazy<R>(callback: () => R): () => R {
  let result: { value: R } | undefined;

  return () => {
    if (!result) {
      result = { value: callback() };
    }

    return result.value;
  };
}
