import { type StoreSelect } from './store-select.js';
import { type StoreSelectOptions } from './store-select-options.js';
import { type StoreState } from './store-state.js';
import { type StoreSubscriber } from './store-subscriber.js';

export interface Store<TState extends object> {
  readonly state: StoreState<TState>;
  subscribe<TValue = StoreState<TState>>(
    this: void,
    subscriber: StoreSubscriber<TValue>,
    select?: StoreSelect<TState, TValue>,
    options?: StoreSelectOptions
  ): () => void;
}
