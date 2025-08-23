import { HEADER_CACHE_CONTROL, HEADER_LAST_MODIFIED } from '../../response/constants.ts';
import type { SendOptions } from '../../response/options.ts';
import { createRoute, type Route } from '../route.ts';

type StatusIndex = keyof typeof Status;

export type HealthCheckConfigs = Readonly<Record<string, HealthCheck | HealthCheckConfig>>;

export type HealthCheck = () => boolean | Promise<boolean>;

export interface HealthCheckConfig {
  /**
   * Function which is invoked in a loop to return the current health status.
   */
  readonly check: HealthCheck;

  /**
   * The amount of time to wait after the plugin is created (ie. when
   * `createHealthRouter` is called) to delay before running the first
   * iteration of all health checks functions.
   *
   * Defaults to `30`.
   */
  readonly initialDelaySeconds?: number;

  /**
   * Minimum number of seconds between updates of any individual health check.
   * Each health check function will be invoked on this cadence, unless a
   * previous invocation is still in progress. If a health check function takes
   * longer than this to complete, the next invocation will be run immediately
   * after the previous one completes.
   *
   * Defaults to `30`.
   */
  readonly intervalSeconds?: number;
}

export interface HealthOptions extends Pick<SendOptions, 'headers'> {
  /**
   * Route path(s). Defaults to `/_health`.
   */
  readonly path?: string | readonly string[];

  /**
   * Invoked just after a health check function completes.
   *
   * Defaults to a function which reports failed checks by logging to stderr
   * (`console.error`). The `error` argument is the error thrown by the health
   * check function, if any.
   */
  readonly onCheck?: ((name: string, result: boolean, error: unknown) => void);
}

const Status = { 0: 'UNKNOWN', 1: 'HEALTHY', 2: 'UNHEALTHY' } as const;
const getStatus = (name: typeof Status[keyof typeof Status]): StatusIndex => {
  return Object.values(Status).indexOf(name) as StatusIndex;
};

export function createHealthRoute(checkCallbacks: HealthCheckConfigs, {
  path = '/_health',
  onCheck,
  ...options
}: HealthOptions = {}): Route {
  const checkResults: Record<string, StatusIndex> = {};

  let statusIndex: StatusIndex = getStatus('UNKNOWN');
  let statusCode: 200 | 503 = 200;
  let lastModified = new Date();

  Object.entries(checkCallbacks).forEach(([name, check]) => addCheck(name, check));

  return createRoute('GET', path, async (_request, response) => {
    response.setHeader(HEADER_CACHE_CONTROL, 'no-store');
    response.setHeader(HEADER_LAST_MODIFIED, lastModified.toUTCString());

    await response.sendJson({ status: statusIndex, checks: checkResults }, {
      ...options,
      status: statusCode,
      replacer: (_key, value) => typeof value === 'number' ? Status[value as StatusIndex] : value,
    });
  });

  function addCheck(name: string, init: HealthCheck | HealthCheckConfig): void {
    const { check, initialDelaySeconds = 0, intervalSeconds = 30 } = typeof init === 'function'
      ? { check: init }
      : init;
    const initialDelayMs = initialDelaySeconds * 1000;
    const intervalMs = intervalSeconds * 1000;
    checkResults[name] = getStatus('UNKNOWN');

    let lastUpdateMs = 0;

    async function update(): Promise<void> {
      lastUpdateMs = Date.now();

      let result: boolean;
      let error: unknown;

      try {
        result = await check();
      }
      catch (checkError: unknown) {
        error = checkError;
        result = false;
      }

      checkResults[name] = getStatus(result ? 'HEALTHY' : 'UNHEALTHY');
      statusIndex = Object.values(checkResults).reduce((result, status) => {
        return Math.max(status, result) as StatusIndex;
      }, getStatus('UNKNOWN'));
      statusCode = statusIndex === getStatus('UNHEALTHY') ? 503 : 200;
      lastModified = new Date();
      onCheck?.(name, result, error);

      const elapsedMs = Math.max(0, Date.now() - lastUpdateMs);
      const delayMs = Math.max(0, intervalMs - elapsedMs);

      setTimeout(() => void update, delayMs).unref();
    }

    setTimeout(() => void update(), initialDelayMs).unref();
  }
}
