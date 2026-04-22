import { Component, type ReadonlyRef, type Ref, type RefValues } from './component.ts';
import { createCallbacks } from './internal/callbacks.ts';
import { $$renderContextStack } from './internal/constants.ts';
import type { Store } from './store.ts';

function getRenderContext(): typeof Component[typeof $$renderContextStack][0] {
  const context = Component[$$renderContextStack].at(-1);
  if (!context) throw new Error('hooks must be called inside a render function');
  return context;
}

export function useRef<T>(initialValue: T, onSet?: (value: T) => void): Ref<T> {
  const { useRef } = getRenderContext();
  return useRef(initialValue, onSet);
}

export function useEffect<const TDeps extends readonly ReadonlyRef<any>[]>(
  deps: TDeps,
  callback: (...values: RefValues<TDeps>) => (() => void) | void,
): void {
  const { onSetRef, onDisconnect } = getRenderContext();
  const cleanup = createCallbacks();
  let values: any[] | undefined;

  onSetRef.push((): void => {
    const newValues = deps.map((dep) => dep.value);
    if (values?.length === newValues.length && values?.every((value, i) => value === newValues[i])) return;
    values = newValues;
    cleanup.run().clear().push(callback(...values as any));
  });

  onDisconnect.push(() => {
    cleanup.run().clear();
  });
}

export function useAttributes<TName extends string>(...names: TName[]): Readonly<Record<TName, Ref<string | null>>> {
  if (names.length === 0) return {} as any;
  const { host, onDisconnect } = getRenderContext();

  const refs = Object.fromEntries(names.map((name) => [
    name,
    useRef(host.getAttribute(name), (value) => {
      if (value == null) host.removeAttribute(name);
      else host.setAttribute(name, value);
    }),
  ]));

  const observer = new MutationObserver((mutation) => {
    for (const { attributeName } of mutation) {
      if (attributeName != null && Object.hasOwn(refs, attributeName)) {
        refs[attributeName]!.value = host.getAttribute(attributeName);
      }
    }
  });

  observer.observe(host, { attributeFilter: names, attributes: true });
  onDisconnect.push(() => observer.disconnect());

  return refs as Readonly<Record<TName, Ref<string | null>>>;
}

export function useChildren(): Ref<Node[]> {
  const { host, onDisconnect } = getRenderContext();
  const ref = useRef([...host.childNodes], (value) => host.replaceChildren(...value));

  const observer = new MutationObserver((mutations) => {
    if (mutations.some((mutation) => mutation.type === 'childList')) {
      const newChildren = [...host.childNodes];
      if (newChildren.length !== ref.value.length) ref.value = newChildren;
      else if (newChildren.some((node, i) => node !== ref.value[i])) ref.value = newChildren;
    }
  });

  observer.observe(host, { childList: true });
  onDisconnect.push(() => observer.disconnect());

  return ref;
}

export function useStore<TState, TValue = TState>(
  store: Store<TState>,
  getter: (state: TState) => TValue,
  setter: (store: Store<TState>, value: TValue) => void,
): Ref<TValue>;
export function useStore<TState, TValue = TState>(
  store: Store<TState>,
  getter?: (state: TState) => TValue,
): ReadonlyRef<TValue>;
export function useStore<TState, TValue = TState>(
  store: Store<TState>,
  getter: (state: TState) => TValue = (state) => state as unknown as TValue,
  setter?: (store: Store<TState>, value: TValue) => void,
): Ref<TValue> {
  const { onDisconnect } = getRenderContext();
  const ref = useRef(getter(store.state), setter && ((value) => setter(store, value)));
  onDisconnect.push(store.subscribe((state) => ref.value = getter(state)));
  return ref;
}
