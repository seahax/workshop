import './init/sentry.ts';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

const root = createRoot(document.querySelector('#app')!);

root.render(
  <StrictMode>
    <div>Hello, Seahax!</div>
  </StrictMode>,
);

const response = await fetch('/auth/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ type: 'login', email: 'admin@example.com', password: 'password123' }),
});
const data = await response.json();

console.log(response, data);
