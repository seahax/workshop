import express, { type Router } from 'express';

export interface Options {
  readonly intervalSeconds?: number;
  readonly initialDelaySeconds?: number;
}

export const createHealthRouter = (
  checkCallbacks: Record<string, () => Promise<boolean> | boolean>,
  { initialDelaySeconds = 0, intervalSeconds = 30 }: Options = {},
): Router => {
  const initialDelayMs = initialDelaySeconds * 1000;
  const intervalMs = intervalSeconds * 1000;
  const checks: Record<string, boolean> = {};

  Object.entries(checkCallbacks).forEach(([name, check]) => startCheck(name, check));

  return express.Router()
    .get('/_health', async (req, res) => {
      const healthy = Object.values(checks).every((result) => result);

      res
        .status(healthy ? 200 : 503)
        .setHeader('Cache-Control', 'max-age=0, no-store')
        .json({ healthy, checks });
    });

  function startCheck(name: string, check: () => Promise<boolean> | boolean): void {
    let lastUpdateMs = 0;

    async function update(): Promise<void> {
      console.log(`health check: ${name}`);
      lastUpdateMs = Date.now();

      let result: boolean;

      try {
        result = await check();
      }
      catch (error: unknown) {
        console.error(error);
        result = false;
      }

      checks[name] = result;

      const elapsedMs = Math.max(0, Date.now() - lastUpdateMs);
      const delayMs = Math.max(0, intervalMs - elapsedMs);

      setTimeout(() => void update, delayMs).unref();
    }

    setTimeout(() => void update(), initialDelayMs).unref();
  }
};
