import './init/sentry.ts';
import './init/mongo.ts';

import { createApplication, createHealthRoute, createInfoRoute, createSpaRoute } from '@seahax/espresso';
import { captureException, captureMessage } from '@sentry/node';
import helmet from 'helmet';
import morgan from 'morgan';

import auth from './auth/controller.ts';
import { mongo } from './health/mongo.ts';
import { config } from './services/config.ts';

const info = createInfoRoute({
  commit: config.commit,
  buildTime: new Date(config.buildTimestamp).toISOString(),
  startTime: new Date(config.startTimestamp).toISOString(),
});

const health = createHealthRoute({ mongo }, {
  onCheck: (name, healthy, error) => {
    if (error) captureException(error, { level: 'error', extra: { healthCheck: name } });
    else if (!healthy) captureMessage(`Health check failed`, { level: 'error', extra: { healthCheck: name } });
  },
});

const spa = createSpaRoute(config.staticPath, {
  headers: (filename) => ({
    'cache-control': filename.startsWith('assets/')
      ? 'public, max-age=31536000, immutable'
      : 'public, max-age=300',
  }),
});

const application = createApplication()
  .addMiddleware(morgan('combined'))
  .addMiddleware(helmet({
    contentSecurityPolicy: { directives: { 'connect-src': ["'self'", 'https://*.sentry.io'] } },
  }))
  .addRoute(info)
  .addRoute(health)
  .addRoute(spa)
  .addController(auth())
  .addErrorHandler(async ({ error }) => {
    captureException(error, { level: 'error' });
  });

application
  .once('closing', () => void config.mongo.close().then(() => console.log('Database closed')))
  .once('close', () => console.log('Application closed'))
  .listen({
    hostname: config.hostname,
    port: config.port,
    onListening: (url) => console.log(`Server listening on ${url}`),
  });

process.on('SIGINT', () => application.close());
process.on('SIGTERM', () => application.close());
