interface DOMEventEmitter<TType extends string> {
  addEventListener(type: TType, listener: (event: any) => any, options?: any): any;
  removeEventListener(type: string, listener: (event: any) => any, options?: any): any;
}

type InferDOMEmitterParameters<
  TType extends string,
  TEmitter extends DOMEventEmitter<TType>,
> = Parameters<TEmitter['addEventListener']>;

/**
 * Helper for adding DOM event listeners with a returned `off` function that
 * follows the same pattern as the `Evented` class.
 */
export function onDOMEvent<const TType extends string, TEmitter extends DOMEventEmitter<TType>>(
  type: TType,
  emitter: TEmitter,
  listener: InferDOMEmitterParameters<TType, TEmitter>[1],
  options?: InferDOMEmitterParameters<TType, TEmitter>[2],
): () => void {
  const listenerInstance = (...args: any[]): any => (listener as any)(...args);

  emitter.addEventListener(type, listenerInstance, options);

  return (): void => {
    emitter.removeEventListener(type, listenerInstance, options);
  };
}
