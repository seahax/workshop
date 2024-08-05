import { createIntercept, type Intercept, type Response } from '@seahax/fetch';

export interface DelayOptions {
  readonly baseSeconds?: number;
  readonly capSeconds?: number;
}

export interface RetryOptions extends DelayOptions {
  readonly count?: number;
  readonly isRetryable?: (response: Response) => boolean;
}

export type RetryCallback = (response: Response, attempts: number) => number | false;

export type RetryInit = RetryCallback | RetryOptions;

export const DEFAULT_RETRY_COUNT = 5;
export const DEFAULT_RETRY_BASE_SECONDS = 1;
export const DEFAULT_RETRY_CAP_SECONDS = 30;
export const DEFAULT_RETRYABLE_METHODS: ReadonlySet<string> = new Set(['GET', 'HEAD', 'OPTIONS', 'PUT', 'DELETE']);
export const DEFAULT_RETRYABLE_STATUSES: ReadonlySet<number> = new Set([408, 425, 500, 502, 503, 504]);

export default function interceptRetry(init?: RetryInit): Intercept {
  const callback = typeof init === 'function' ? init : getDefaultCallback(init);

  return createIntercept(async (request, next) => {
    for (let attempts = 0; ; ++attempts) {
      const response = await next(request);
      const retrySeconds = callback(response, attempts);

      if (retrySeconds === false || retrySeconds <= 0) {
        return response;
      }

      await Promise.race([
        getTimeoutPromise(retrySeconds),
        getSignalPromise(request.signal),
      ]);
    }
  });
}

export function isDefaultRetryable(response: Response): boolean {
  if (!DEFAULT_RETRYABLE_METHODS.has(response.request.method)) return false;
  if (!DEFAULT_RETRYABLE_STATUSES.has(response.status)) return false;

  return true;
}

export function getDefaultDelaySeconds(
  attempts: number,
  {
    baseSeconds = DEFAULT_RETRY_BASE_SECONDS,
    capSeconds = DEFAULT_RETRY_CAP_SECONDS,
  }: DelayOptions = {},
): number {
  return Math.min(capSeconds, baseSeconds * 2 ** attempts) * Math.random();
}

function getDefaultCallback({
  count = DEFAULT_RETRY_COUNT,
  isRetryable = isDefaultRetryable,
  ...delayOptions
}: RetryOptions = {}): RetryCallback {
  return (response, attempts) => {
    if (attempts < count && isRetryable(response)) {
      return getDefaultDelaySeconds(attempts, delayOptions);
    }

    return false;
  };
}

function getTimeoutPromise(seconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}

function getSignalPromise(signal: AbortSignal): Promise<void> {
  signal.throwIfAborted();

  return new Promise((_, reject) => {
    signal.addEventListener('abort', () => {
      reject(new DOMException('This operation was aborted', 'AbortError'));
    });
  });
}
