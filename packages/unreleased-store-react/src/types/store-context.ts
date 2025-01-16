import { type Store, type StoreSelect, type StoreSelectOptions, type StoreState } from '@seahax/store';
import { type Context } from 'react';

/**
 * React bindings for a `@seahax/store`.
 */
export interface StoreContext<TState extends object> extends Context<Store<TState>> {
  /**
   * Use the store instance. Mostly intended for internal use. Using the
   * `useStore` hook is recommended for most cases. Using the store does not
   * subscribe to state changes.
   */
  useStoreContext(): Store<TState>;

  /**
   * Use all or part of the store state.
   */
  useStore<TValue = StoreState<TState>>(
    this: void,
    select?: StoreSelect<TState, TValue>,
    options?: StoreSelectOptions
  ): TValue;
}
