import { type Store, type StoreSelect, type StoreSelectOptions, type StoreState } from '@seahax/store';
import { createContext, useContext, useEffect, useState } from 'react';

import { type StoreContext } from './types/store-context.js';
import { useStableSelect } from './use-stable-select.js';

export function createStoreContext<TState extends object>(store: Store<TState>): StoreContext<TState> {
  const StoreContext = Object.assign(createContext(store), { displayName: 'StoreContext' });

  const useStoreContext = (): Store<TState> => {
    return useContext(StoreContext);
  };

  const useStore = <TValue = StoreState<TState>>(
    select: StoreSelect<TState, TValue> = (v: any) => v,
    { shallow = false }: StoreSelectOptions = {},
  ): TValue => {
    const store = useStoreContext();
    const [state, setState] = useState(() => select(store.state));
    // Stabilize the select function to avoid unnecessary re-subscriptions.
    // This also means that changes to the select function will NOT be
    // reflected until the store or state is updated.
    const stableSelect = useStableSelect(select);

    // Subscribe to the store, and re-subscribe if the store or select options
    // change. The stable select function is included in the dependency array
    // for completeness, even though it _should_ never change.
    useEffect(() => {
      return store.subscribe((state) => setState(state), stableSelect, { shallow });
    }, [store, stableSelect, shallow]);

    // Reselect the state if the store changes. Also handles the case where
    // the state changed between the initial state capture and subscribing to
    // the store as an effect.
    useEffect(() => {
      setState(stableSelect(store.state));
    }, [store, stableSelect]);

    return state;
  };

  return Object.assign(StoreContext, { useStoreContext, useStore });
}
