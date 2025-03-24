import type { AddressInfo } from 'node:net';

import compression from 'compression';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

import { authRouter } from './routers/auth.ts';
import { healthRouter } from './routers/health.ts';
import { staticRouter } from './routers/static.ts';

const app = express();

app.use(morgan('tiny'));
app.use(helmet());
app.use(express.json());
app.use(compression());
app.use(healthRouter);
app.use(authRouter);
app.use(staticRouter); // Must be last.

const http = app.listen(8080, () => {
  console.log(`Server is listening on port ${(http.address() as AddressInfo).port}`);
});

process.on('SIGINT', close);
process.on('SIGTERM', close);

function close(): void {
  console.log('\nServer is shutting down');
  http.close();
}
