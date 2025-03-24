import fs from 'node:fs/promises';
import path from 'node:path';

import express, { type Router } from 'express';

import { config } from '../config.ts';

export const staticRouter: Router = express.Router()
  // Immutable static assets (hashed)
  .use('/assets/', express.static(`${config.staticPath}/assets`, {
    redirect: false,
    fallthrough: true,
    cacheControl: false,
    index: false,
    setHeaders: (res) => res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'),
  }))
  // Other static assets (un-hashed)
  .use(express.static(config.staticPath, {
    redirect: false,
    fallthrough: true,
    cacheControl: false,
    index: false,
    setHeaders: (res) => res.setHeader('Cache-Control', 'public, max-age=86400, must-revalidate'),
  }))
  .use(async (req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      next();
      // res.status(405)
      //   .setHeader('Allow', 'GET, HEAD')
      //   .setHeader('Content-Length', '0').end();
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
      .setHeader('Cache-Control', 'public, max-age=86400, must-revalidate')
      .sendFile(path.resolve(config.staticPath, 'index.html'));
  });
