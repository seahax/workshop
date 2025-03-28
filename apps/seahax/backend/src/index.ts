import type { AddressInfo } from 'node:net';

import compression from 'compression';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

import { initDatabase } from './database.ts';
import { createAuthRouter } from './routers/auth.ts';
import { createHealthRouter } from './routers/health.ts';
import { createStaticRouter } from './routers/static.ts';

process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));

const db = await initDatabase();
const app = express().use(
  morgan('tiny'),
  helmet(),
  express.json(),
  compression(),
  createHealthRouter({
    database: () => db.isConnected(),
  }),
  createAuthRouter({ db }),
  createStaticRouter(), // Must be last.
);

const server = app.listen(8080, () => {
  console.log(`Server is listening on port ${(server.address() as AddressInfo).port}`);
}).on('close', () => {
  console.log('Server is closed');
});
