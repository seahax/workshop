import { type ReadonlyRef, type Ref, type RefValues } from '../component.ts';
import { createCallbacks } from '../internal/callbacks.ts';
import { $$renderContextStack } from '../internal/constants.ts';

export function useRef<T>(initialValue: T, onChange?: (value: T) => void): Ref<T> {
  return getHookContext().useRef(initialValue, onChange);
}

export function useEffect<const TDeps extends readonly ReadonlyRef<any>[]>(
  deps: TDeps,
  callback: (...values: RefValues<TDeps>) => (() => void) | void,
): void {
  const { onSetRef, onDisconnect } = getHookContext();
  const cleanupCallback = createCallbacks();
  const cleanup = (): void => cleanupCallback.run({ clear: true });
  let values: any[] | undefined;

  onSetRef.push((): void => {
    const newValues = deps.map((dep) => dep.value);
    if (values?.length === newValues.length && values?.every((value, i) => value === newValues[i])) return;
    values = newValues;
    cleanup();
    const maybeCleanup = callback(...(values as any));
    if (maybeCleanup) cleanupCallback.push(() => maybeCleanup());
  });

  onDisconnect.push(cleanup);
}

export function useAttributes<TName extends string>(...names: TName[]): Readonly<Record<TName, Ref<string | null>>> {
  if (names.length === 0) return {} as any;
  const { host } = getHookContext();

  const refs = Object.fromEntries(
    names.map((name) => [
      name,
      useRef(host.getAttribute(name), (value) => {
        if (value == null) host.removeAttribute(name);
        else host.setAttribute(name, value);
      }),
    ]),
  );

  const observer = new MutationObserver((mutation) => {
    for (const { attributeName } of mutation) {
      if (attributeName != null && Object.hasOwn(refs, attributeName)) {
        refs[attributeName]!.value = host.getAttribute(attributeName);
      }
    }
  });

  useEffect([], () => {
    observer.observe(host, { attributeFilter: names, attributes: true });
    return () => observer.disconnect();
  });

  return refs as Readonly<Record<TName, Ref<string | null>>>;
}

function getHookContext(): (typeof window)[typeof $$renderContextStack][0] {
  const context = window[$$renderContextStack].at(-1);
  if (!context) throw new Error('hooks must be called inside a render function');
  return context;
}
