import fs from 'node:fs/promises';
import path from 'node:path';

import express, { type Request, type Router } from 'express';

export const CACHE_CONTROL_DEFAULT = 'public, max-age=86400, must-revalidate';
export const CACHE_CONTROL_IMMUTABLE_DEFAULT = 'public, max-age=31536000, immutable';

export interface SpaOptions {
  /**
   * Path of the HTML file (relative to the static path) to serve for SPA
   * fallback. Defaults to `index.html`.
   */
  readonly indexFilename?: string;
  /**
   * Cache-control header for mutable static assets.
   */
  readonly cacheControl?: string | ((req: Request) => string);
}

export default function createSpaRouter(staticPath: string, {
  indexFilename = 'index.html',
  cacheControl = defaultCacheControl,
}: SpaOptions = {}): Router {
  const router = express.Router();

  // Static assets that explicitly match the request path.
  router.use(express.static(staticPath, {
    redirect: false,
    fallthrough: true,
    cacheControl: false,
    index: false,
    setHeaders: (res) => {
      const cacheControlValue = typeof cacheControl === 'function'
        ? cacheControl(res.req)
        : cacheControl;

      res.setHeader('Cache-Control', cacheControlValue);
    },
  }));

  // SPA fallback
  router.use(async (req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      next();
      return;
    }

    const filename = path.resolve(staticPath, indexFilename);
    const stats = await fs.stat(filename).catch(() => null);

    if (!stats) {
      next();
      return;
    }

    const cacheControlValue = typeof cacheControl === 'function'
      ? cacheControl(req)
      : cacheControl;

    res.status(200)
      .setHeader('Content-Length', stats.size)
      .setHeader('Cache-Control', cacheControlValue)
      .sendFile(filename);
  });

  return router;
}

export function defaultCacheControl(req: Request): string {
  return req.path.startsWith('/assets/')
    ? CACHE_CONTROL_IMMUTABLE_DEFAULT
    : CACHE_CONTROL_DEFAULT;
}
