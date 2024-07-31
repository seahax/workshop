type UnionToIntersection<TUnion> = (
  TUnion extends unknown ? (distributedUnion: TUnion) => void : never
) extends ((mergedIntersection: infer Intersection) => void)
  ? Intersection & TUnion : never;

type PickEvents<TEvents extends object> = {
  [TName in keyof TEvents as TEvents[TName] extends (...args: any[]) => void ? TName : never
  ]: Extract<TEvents[TName], (...args: any[]) => void>;
};

interface ListenerOptions {
  once?: boolean;
}

export class Evented<const TEvents extends object> {
  private readonly _listeners = new Map<string | number | symbol, Set<(...args: any[]) => void>>();

  constructor() {
    this.on = this.on.bind(this);
    this.emit = this.emit.bind(this);
  }

  on<TName extends keyof PickEvents<TEvents>>(
    name: TName,
    listener: UnionToIntersection<PickEvents<TEvents>[TName]>,
    { once = false }: ListenerOptions = {},
  ): () => void {
    let listeners = this._listeners.get(name);

    if (!listeners) {
      listeners = new Set();
      this._listeners.set(name, listeners);
    }

    const wrapper = once
      ? (...args: any[]): void => {
          off();
          listener(...args);
        }
      : (...args: any[]): void => {
          listener(...args);
        };

    const off = (): void => {
      listeners.delete(wrapper);
    };

    listeners.add(wrapper);

    return off;
  }

  emit<TName extends keyof PickEvents<TEvents>>(
    name: TName,
    ...args: Parameters<PickEvents<TEvents>[TName]>
  ): boolean {
    const listeners = this._listeners.get(name);

    if (listeners?.size) {
      for (const callback of listeners) {
        Reflect.apply(callback, { name, emitter: this }, args);
      }

      return true;
    }

    return false;
  }
}
