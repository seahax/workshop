import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';

const server = createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.write(JSON.stringify({ message: 'Hello, World!' }));
  res.end();
});

server.listen(8080, '0.0.0.0', () => {
  console.log(`Server is listening on port ${(server.address() as AddressInfo).port}`);
});

process.on('SIGINT', close);
process.on('SIGTERM', close);

function close(): void {
  console.log('Server is shutting down.');
  server.close();
}
