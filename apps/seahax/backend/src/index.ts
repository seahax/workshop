import './sentry.ts';

import type { AddressInfo } from 'node:net';

import health from '@seahax/express-health';
import info from '@seahax/express-info';
import spa from '@seahax/express-spa';
import * as sentry from '@sentry/node';
import compression from 'compression';
import express, { json } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

import auth from './auth/router.ts';
import { background } from './background.ts';
import { config } from './config.ts';
import { mongo } from './health/mongo.ts';

process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));

const app = express();

// Middleware
app.use(morgan('tiny'));
app.use(helmet({ contentSecurityPolicy: { directives: { 'connect-src': ["'self'", 'https://*.sentry.io'] } } }));
app.use(json());
app.use(compression());

// Routes
app.get('/_info', info({
  commit: config.commit,
  buildTime: new Date(config.buildTimestamp).toISOString(),
  startTime: new Date(config.startTimestamp).toISOString(),
}));
app.get('/_health', health({ mongo }));
app.use(auth());
app.use(spa(config.staticPath)); // Must be the last router.

// Error handling
sentry.setupExpressErrorHandler(app);

const server = app.listen(8080, () => {
  console.log(`Server is listening on port ${(server.address() as AddressInfo).port}`);
}).on('close', () => {
  console.log('Server is closed');
});

background(async () => {
  // Connect to the MongoDB preemptively to detect problems early and avoid
  // delaying the first request. If this fails, it may not be fatal, because
  // the mongo client will try to connect when used.
  await config.mongo.connect();
}, { task: 'mongo-connect', failureSeverity: 'warning' });
