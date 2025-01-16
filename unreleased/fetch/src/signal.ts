/**
 * See [AbortSignal.any](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/any_static).
 */
export const signalAny = 'any' in AbortSignal
  ? AbortSignal.any.bind(AbortSignal)
  : (signals: Iterable<AbortSignal>) => {
      const controller = new AbortController();

      for (const signal of signals) {
        if (signal.aborted) {
          controller.abort(signal.reason);
          break;
        }

        signal.addEventListener('abort', () => controller.abort(signal.reason));
      }

      return controller.signal;
    };
