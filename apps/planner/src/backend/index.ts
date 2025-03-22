import type { AddressInfo } from 'node:net';
import path from 'node:path';

import express from 'express';
import helmet from 'helmet';

const STATIC_ROOT = path.resolve(import.meta.dirname, '../frontend');
const app = express();

app.use(helmet());

// Health check
app.all('/health', async (req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.write(JSON.stringify({ message: 'Hello, World!' }));
  res.end();
});

// Immutable static assets (hashed)
app.use('/assets/', express.static(`${STATIC_ROOT}/assets`, {
  redirect: false,
  fallthrough: true,
  cacheControl: true,
  immutable: true,
  maxAge: '2y',
}));

// Other static assets (un-hashed)
app.use(express.static(STATIC_ROOT, {
  redirect: false,
}));

const server = app.listen(8080, '0.0.0.0', () => {
  console.log(`Server is listening on port ${(server.address() as AddressInfo).port}`);
});

process.on('SIGINT', close);
process.on('SIGTERM', close);

function close(): void {
  console.log('\nServer is shutting down');
  server.close();
}
