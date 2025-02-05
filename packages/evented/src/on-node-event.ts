import { type OverloadUnion } from './types.ts';

interface NodeEventEmitter {
  on(event: string, listener: (...args: any[]) => any): any;
  once(event: string, listener: (...args: any[]) => any): any;
  off(event: string, listener: (...args: any[]) => any): any;
}

type InferNodeEmitterParameters<
  TType extends string,
  TEmitter extends NodeEventEmitter,
> = Parameters<Extract<
  Exclude<OverloadUnion<TEmitter['on']>, (type: string, ...args: any[]) => any>,
  (type: TType, ...args: any[]) => any
>>;

export function onNodeEvent<const TType extends string, TEmitter extends NodeEventEmitter>(
  type: TType,
  emitter: TEmitter,
  listener: InferNodeEmitterParameters<TType, TEmitter>[1],
  options?: { readonly once?: boolean },
): () => void {
  const listenerInstance = (...args: any[]): void => (listener as any)(...args);

  if (options?.once) {
    emitter.once(type, listenerInstance);
  }
  else {
    emitter.on(type, listenerInstance);
  }

  return (): void => {
    emitter.off(type, listenerInstance);
  };
}
