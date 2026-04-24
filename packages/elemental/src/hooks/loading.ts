import type { ReadonlyRef, Ref, RefValues } from '../component.ts';
import { useEffect, useRef } from './core.ts';

export interface LoadingValue<TValue> {
  readonly loading: boolean;
  readonly value: TValue | undefined;
  readonly error: unknown;
}

export interface LoadingOptions {
  readonly debounceMs?: number;
}

export function useLoading<const TDeps extends readonly ReadonlyRef<any>[], TValue>(
  deps: TDeps,
  callback: (signal: AbortSignal, ...values: RefValues<TDeps>) => Promise<TValue>,
  { debounceMs }: LoadingOptions = {},
): Ref<LoadingValue<TValue>> {
  const ref = useRef<LoadingValue<TValue>>({ loading: true, value: undefined, error: undefined });
  let skipDebounce = true;

  useEffect(deps, () => (...values) => {
    const ac = new AbortController();

    Promise.race(
      skipDebounce
        ? [Promise.resolve()]
        : [
            new Promise((resolve) => setTimeout(resolve, debounceMs)),
            new Promise((resolve) => ac.signal.addEventListener('abort', resolve, { once: true })),
          ],
    )
      .then(() => {
        if (ac.signal.aborted) return;
        return callback(ac.signal, ...(values as any));
      })
      .then((value) => {
        if (ac.signal.aborted) return;
        ref.value = { loading: false, value, error: undefined };
      })
      .catch((error: unknown) => {
        if (ac.signal.aborted) return;
        ref.value = { loading: false, value: undefined, error };
      });

    skipDebounce = false;
    return () => ac.abort();
  });

  // Skip the debounce again if the component unmounts.
  useEffect([], () => () => (skipDebounce = true));

  return ref;
}
