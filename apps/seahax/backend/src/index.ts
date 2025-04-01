import type { AddressInfo } from 'node:net';

import health from '@seahax/express-health';
import spa from '@seahax/express-spa';
import compression from 'compression';
import express, { json } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

import auth from './auth/router.ts';
import { config } from './config.ts';
import { mongo } from './health/mongo.ts';

const app = express();

app.use(morgan('tiny'));
app.use(helmet());
app.use(json());
app.use(compression());
app.get('/_health', health({ mongo }));
app.use('/auth/', auth());
app.use(spa(config.staticPath)); // Must be last.

const server = app.listen(8080, '127.0.0.1', () => {
  console.log(`Server is listening on port ${(server.address() as AddressInfo).port}`);
}).on('close', () => {
  console.log('Server is closed');
});

// Connect to the MongoDB preemptively to detect problems early and avoid
// delaying the first request. If this fails, it may not be fatal, because the
// mongo client will try to connect when used.
config.mongo.connect().catch((error: unknown) => {
  console.error('Failed to connect to mongo:', error);
});

process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));
