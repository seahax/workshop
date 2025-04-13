import './sentry.ts';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { authClient } from './clients.ts';

const root = createRoot(document.querySelector('#app')!);

root.render(
  <StrictMode>
    <div>Hello, Seahax!</div>
  </StrictMode>,
);

const response = await authClient.getToken({
  body: { type: 'login', email: 'admin@example.com', password: 'password123' },
});

console.log(response);
