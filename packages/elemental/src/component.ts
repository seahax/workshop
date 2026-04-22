import { type CallbackList, createCallbacks } from './internal/callbacks.ts';
import { $$ref, $$renderContextStack } from './internal/constants.ts';

export interface ComponentOptions {
  readonly shadow?: Partial<ShadowRootInit>;
}

export interface Ref<T> extends ReadonlyRef<T> {
  value: T;
}

export interface ReadonlyRef<T> {
  [$$ref]: unknown;
  readonly value: T;
}

export type RefValues<T> = T extends readonly any[]
  ? { [K in keyof T]: T[K] extends ReadonlyRef<infer V> ? V : never }
  : never;

export abstract class Component extends HTMLElement {
  static readonly [$$renderContextStack]: {
    readonly host: Component;
    readonly onDisconnect: CallbackList;
    readonly onSetRef: CallbackList;
    readonly useRef: <T>(initialValue: T, onSet?: (value: T) => void) => Ref<T>;
  }[] = [];

  readonly #shadowOptions: ShadowRootInit;
  readonly #onDisconnect = createCallbacks();
  readonly #onSetRef = createCallbacks();
  #notifying = false;

  constructor({ shadow }: ComponentOptions = {}) {
    super();
    this.#shadowOptions = { ...shadow, mode: shadow?.mode ?? 'open' };
  }

  /** Called when the custom element is connected. */
  protected abstract render(shadow: ShadowRoot): void;

  /** Create a value reference that can be tracked by `useEffect` hooks */
  protected useRef<T>(initialValue: T, onSet?: (value: T) => void): Ref<T> {
    const notify = this.#notify.bind(this);
    let value = initialValue;

    return {
      [$$ref]: true,
      get value() {
        return value;
      },
      set value(newValue) {
        if (newValue === value) return;
        value = newValue;
        onSet?.(value);
        notify();
      },
    };
  }

  protected connectedCallback(): void {
    const shadow = this.attachShadow(this.#shadowOptions);

    try {
      Component[$$renderContextStack].push({
        host: this,
        onDisconnect: this.#onDisconnect,
        onSetRef: this.#onSetRef,
        useRef: this.useRef.bind(this),
      });

      this.render(shadow);
    }
    finally {
      Component[$$renderContextStack].pop();
    }

    this.#onSetRef.run();
  }

  protected disconnectedCallback(): void {
    this.#onDisconnect.run().clear();
    this.#onSetRef.clear();
  }

  #notify(): void {
    if (this.#notifying) return;
    this.#notifying = true;

    queueMicrotask(() => {
      this.#notifying = false;
      this.#onSetRef.run();
    });
  }
}

/** Add a custom element to a custom element registry. */
export function defineComponent<T extends typeof HTMLElement & { readonly tag: string }>(
  componentType: T,
  registry: CustomElementRegistry = customElements,
): T {
  registry.define(componentType.tag, componentType);
  return componentType;
}
