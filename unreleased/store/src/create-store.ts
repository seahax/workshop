import { type Store } from './types/store.ts';
import { type StoreGet } from './types/store-get.ts';
import { type StoreInit } from './types/store-init.ts';
import { type StoreSelectOptions } from './types/store-select-options.ts';
import { type StoreSet } from './types/store-set.ts';
import { type StoreState } from './types/store-state.ts';

const NONE = Symbol('NONE');

export function createStore<TState extends object>(factory: StoreInit<TState>): Store<TState> {
  let state: StoreState<TState>;

  const subscriptions = new Set<() => void>();

  const store: Store<TState> = {
    get state() {
      return state;
    },
    subscribe(subscriber, select = (v: any) => v, { shallow = false }: StoreSelectOptions = {}) {
      let prev: any = NONE;

      const isEqual = shallow ? isShallowEqual : Object.is;
      const subscription = (): void => {
        const next = select(state);

        if (isEqual(prev, next)) return;

        subscriber(prev = next);
      };

      subscriptions.add(subscription);

      return () => void subscriptions.delete(subscription);
    },
  };

  const set: StoreSet<TState> = (factory) => {
    const newState = Object.entries(factory(state)).reduce<StoreState<TState>>((state, [key, value]) => {
      return Object.is(state[key as keyof typeof state], value) ? state : { ...state, [key]: value };
    }, state);

    if (Object.is(state, newState)) return;

    state = newState;

    for (const subscriber of subscriptions) {
      subscriber();
    }
  };

  const get: StoreGet<TState> = () => state;

  state = factory(set, get) as StoreState<TState>;

  return store;
}

function isShallowEqual(a: unknown, b: unknown): boolean {
  if (Array.isArray(a)) {
    if (!Array.isArray(b)) return false;
    if (a.length !== b.length) return false;

    const aValues = a.values();
    const bValues = b.values();

    for (const value of aValues) {
      if (!Object.is(value, bValues.next().value)) return false;
    }

    return true;
  }

  if (a instanceof Set) {
    if (!(b instanceof Set)) return false;
    if (a.size !== b.size) return false;

    const aValues = a.values();
    const bValues = b.values();

    for (const value of aValues) {
      if (!Object.is(value, bValues.next().value)) return false;
    }

    return true;
  }

  if (a instanceof Map) {
    if (!(b instanceof Map)) return false;
    if (a.size !== b.size) return false;

    const aEntries = a.entries();

    for (const [k, v] of aEntries) {
      if (!b.has(k)) return false;
      if (!Object.is(v, b.get(k))) return false;
    }

    return true;
  }

  if (typeof a === 'object' && a !== null) {
    if (typeof b !== 'object' || b === null) return false;

    const entries = Object.entries(a);

    if (entries.length !== Object.keys(b).length) return false;

    return entries.every(([k, v]) => {
      if (!Object.prototype.propertyIsEnumerable.call(b, k)) return false;
      if (!Object.is(v, b[k as never])) return false;

      return true;
    });
  }

  return Object.is(a, b);
}
