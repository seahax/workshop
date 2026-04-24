import { type Callbacks, createCallbacks } from './internal/callbacks.ts';
import { $$ref, $$renderContextStack } from './internal/constants.ts';

type SafeProps<TProps> = any extends any
  ? { [P in keyof TProps as P extends keyof HTMLElement ? never : P]: TProps[P] }
  : never;

export interface ComponentOptions<TProps extends object> {
  readonly shadow?: Partial<ShadowRootInit>;
  readonly props?: {
    [P in keyof SafeProps<TProps>]: (
      ref: Ref<TProps[P] | undefined>,
      host: HTMLElement,
    ) => ComponentPropertyDescriptor<TProps[P]>;
  };
}

export interface ComponentPropertyDescriptor<T> extends Omit<PropertyDescriptor, 'value' | 'get' | 'set'> {
  get(): T;
  set?(value: T): void;
}

export type ComponentWithProps<TProps extends object> = HTMLElement & {
  -readonly [P in keyof SafeProps<TProps>]: TProps[P];
};

export type ComponentShadowRoot<TProps extends object> = Omit<ShadowRoot, 'host'> & {
  readonly host: ComponentWithProps<TProps>;
};

export type ComponentPropRefs<TProps extends object> = any extends any
  ? { readonly [P in keyof SafeProps<TProps>]: Ref<TProps[P] | undefined> }
  : never;

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

declare global {
  interface Window {
    readonly [$$renderContextStack]: {
      readonly host: HTMLElement;
      readonly onDisconnect: Callbacks;
      readonly onSetRef: Callbacks;
      readonly useRef: <T>(initialValue: T, onChange?: (value: T) => void) => Ref<T>;
    }[];
  }
}

Object.assign(window, { [$$renderContextStack]: [] });

export function defineComponent<TProps extends object = {}>(
  render: (shadow: ComponentShadowRoot<TProps>, props: ComponentPropRefs<TProps>) => void,
  options?: ComponentOptions<TProps>,
): new () => ComponentWithProps<SafeProps<TProps>>;
export function defineComponent(
  render: (
    shadow: ComponentShadowRoot<Record<string, unknown>>,
    props: ComponentPropRefs<Record<string, unknown>>,
  ) => void,
  options: ComponentOptions<Record<string, unknown>> = {},
): new () => HTMLElement {
  return class extends HTMLElement {
    readonly #onDisconnect = createCallbacks();
    readonly #onSetRef = createCallbacks();
    readonly #options = options;
    readonly #refs: ComponentPropRefs<Record<string, unknown>>;
    #notifying = false;

    constructor() {
      super();
      const refs: Record<string, Ref<unknown>> = (this.#refs = {});

      if (this.#options.props) {
        const descriptors = this.#options.props;

        for (const [key, getDescriptor] of Object.entries(descriptors)) {
          if (key in this) continue;
          const ref = (refs[key] = this.#useRef<any>(undefined));
          const descriptor = getDescriptor(ref, this);
          Object.defineProperty(this, key, descriptor);
        }
      }
    }

    protected connectedCallback(): void {
      const shadow = this.attachShadow({ ...this.#options.shadow, mode: this.#options.shadow?.mode ?? 'open' });

      try {
        window[$$renderContextStack].push({
          host: this,
          onDisconnect: this.#onDisconnect,
          onSetRef: this.#onSetRef,
          useRef: this.#useRef,
        });

        render(shadow as ComponentShadowRoot<Record<string, unknown>>, this.#refs);
      } finally {
        window[$$renderContextStack].pop();
      }

      this.#onSetRef.run();
    }

    protected disconnectedCallback(): void {
      this.#onSetRef.clear();
      this.#onDisconnect.run({ clear: true });
    }

    readonly #useRef = <T>(initialValue: T, onChange?: (value: T) => void): Ref<T> => {
      const notify = this.#notify;
      let value = initialValue;

      return {
        [$$ref]: true,
        get value() {
          return value;
        },
        set value(newValue) {
          if (newValue === value) return;
          value = newValue;
          onChange?.(value);
          notify();
        },
      };
    };

    readonly #notify = (): void => {
      if (this.#notifying) return;
      this.#notifying = true;

      queueMicrotask(() => {
        this.#notifying = false;
        this.#onSetRef.run();
      });
    };
  };
}
