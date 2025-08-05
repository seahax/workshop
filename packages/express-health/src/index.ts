import type { RequestHandler } from 'express';

type Status = 'starting' | 'healthy' | 'unhealthy';

export interface HealthOptions {
  /**
   * False to disable the `checks` property in the response which contains the
   * individual status of each health check.
   *
   * Defaults to `true`.
   */
  readonly includeCheckStatusInResponse?: boolean;

  /**
   * The amount of time to wait after the plugin is created (ie. when
   * `createHealthRouter` is called) to delay before running the first
   * iteration of all health checks functions.
   *
   * Defaults to `0`.
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

  /**
   * Invoked just before a health check function is called.
   */
  readonly onCheckStart?: (name: string) => void;
  /**
   * Invoked just after a health check function completes.
   *
   * Defaults to a function which reports failed checks by logging to stderr
   * (`console.error`). The `error` argument is the error thrown by the health
   * check function, if any.
   */
  readonly onCheckEnd?: ((name: string, result: boolean, error: unknown) => void);
}

export default function createHealthHandler(checkCallbacks: Record<string, () => Promise<boolean> | boolean>, {
  includeCheckStatusInResponse = true,
  initialDelaySeconds = 0,
  intervalSeconds = 30,
  onCheckStart,
  onCheckEnd = (name: string, result: boolean, error: unknown) => {
    if (!result) console.error(`Health check "${name}" failed.`, error);
  },
}: HealthOptions = {}): RequestHandler {
  const initialDelayMs = initialDelaySeconds * 1000;
  const intervalMs = intervalSeconds * 1000;
  const checks = new Map<string, Status>();
  const handler: RequestHandler = async (req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      next();
      return;
    }

    const status: Status = (() => {
      const statuses = new Set(checks.values());
      if (statuses.has('unhealthy')) return 'unhealthy';
      if (statuses.has('starting')) return 'starting';
      return 'healthy';
    })();

    res
      .status(status === 'healthy' ? 200 : 503)
      .setHeader('Cache-Control', 'max-age=0, no-store')
      .json({
        status,
        ...(
          includeCheckStatusInResponse
            ? { checks: Object.fromEntries(checks.entries()) }
            : {}
        ),
      });
  };

  // Start all the health checks.
  Object.entries(checkCallbacks).forEach(([name, check]) => addCheck(name, check));

  return handler;

  function addCheck(name: string, check: () => Promise<boolean> | boolean): void {
    checks.set(name, 'starting');

    let lastUpdateMs = 0;

    async function update(): Promise<void> {
      lastUpdateMs = Date.now();

      try {
        let result: boolean;
        let error: unknown;

        onCheckStart?.(name);

        try {
          result = await check();
        }
        catch (checkError: unknown) {
          error = checkError;
          result = false;
        }

        checks.set(name, result ? 'healthy' : 'unhealthy');
        onCheckEnd(name, result, error);
      }
      catch (error) {
        // The start or end callback threw an error.
        console.error(error);

        if (!checks.has(name) || checks.get(name) === 'starting') {
          checks.set(name, 'unhealthy');
        }
      }

      const elapsedMs = Math.max(0, Date.now() - lastUpdateMs);
      const delayMs = Math.max(0, intervalMs - elapsedMs);

      setTimeout(() => void update, delayMs).unref();
    }

    setTimeout(() => void update(), initialDelayMs).unref();
  }
};
