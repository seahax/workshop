import { type StoreSelect } from './store-select.ts';
import { type StoreSelectOptions } from './store-select-options.ts';
import { type StoreState } from './store-state.ts';
import { type StoreSubscriber } from './store-subscriber.ts';

export interface Store<TState extends object> {
  readonly state: StoreState<TState>;
  subscribe<TValue = StoreState<TState>>(
    this: void,
    subscriber: StoreSubscriber<TValue>,
    select?: StoreSelect<TState, TValue>,
    options?: StoreSelectOptions
  ): () => void;
}
