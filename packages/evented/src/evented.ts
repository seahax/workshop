import { type PickByType, type UnionToIntersection } from './types.ts';

type Events<TEvents extends object> = (
  PickByType<TEvents, (...args: any[]) => void>
);

type EventName<TEvents extends object> = (
  keyof Events<TEvents>
);

type EventListener<TEvents extends object, TName extends EventName<TEvents>> = (
  UnionToIntersection<Events<TEvents>[TName]>
);

type EventArgs<TEvents extends object, TName extends EventName<TEvents>> = (
  Parameters<EventListener<TEvents, TName>>
);

interface EventListenerOptions {
  once?: boolean;
}

export class Evented<const TEvents extends object> {
  private readonly _listeners = new Map<string | number | symbol, Set<(...args: any[]) => void>>();

  constructor() {
    this.on = this.on.bind(this);
    this.emit = this.emit.bind(this);
  }

  on<TName extends EventName<TEvents>>(
    name: TName,
    listener: EventListener<TEvents, TName>,
    { once = false }: EventListenerOptions = {},
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

  emit<TName extends EventName<TEvents>>(
    name: TName,
    ...args: EventArgs<TEvents, TName>
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
