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

void authClient.login({ body: { email: 'admin@example.com', password: 'password123' } });
