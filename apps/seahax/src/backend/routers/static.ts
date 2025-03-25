import fs from 'node:fs/promises';
import path from 'node:path';

import express, { type Router } from 'express';

import { config } from '../config.ts';

const CACHE_CONTROL_IMMUTABLE = 'public, max-age=31536000, immutable';
const CACHE_CONTROL_MUTABLE = 'public, max-age=86400, must-revalidate';

export const staticRouter: Router = express.Router()
  // Immutable static assets (hashed)
  .use('/assets/', express.static(`${config.staticPath}/assets`, {
    redirect: false,
    fallthrough: true,
    cacheControl: false,
    index: false,
    setHeaders: (res) => res.setHeader('Cache-Control', CACHE_CONTROL_IMMUTABLE),
  }))

  // Other static assets (un-hashed)
  .use(express.static(config.staticPath, {
    redirect: false,
    fallthrough: true,
    cacheControl: false,
    index: false,
    setHeaders: (res) => res.setHeader('Cache-Control', CACHE_CONTROL_MUTABLE),
  }))

  // SPA fallback
  .use(async (req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      next();
      return;
    }

    const filename = path.resolve(config.staticPath, 'index.html');
    const stats = await fs.stat(filename).catch(() => null);

    if (!stats) {
      next();
      return;
    }

    res.status(200)
      .setHeader('Content-Length', stats.size)
      .setHeader('Cache-Control', CACHE_CONTROL_MUTABLE)
      .sendFile(path.resolve(config.staticPath, 'index.html'));
  });
