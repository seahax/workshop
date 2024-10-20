import { type StoreSelect } from '@seahax/store';
import { useLayoutEffect, useRef } from 'react';

/**
 * Return a stable version of the selector. The implementation is updated as a
 * layout effect, and so it should be up-to-date in _subsequent_ effects.
 */
export function useStableSelect<TState extends object, TValue>(
  select: StoreSelect<TState, TValue>,
): StoreSelect<TState, TValue> {
  const ref = useRef(select);

  useLayoutEffect(() => {
    ref.current = select;
  }, [select]);

  return (state) => ref.current(state);
}
