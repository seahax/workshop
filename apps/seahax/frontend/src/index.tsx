import './init/sentry.ts';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

const root = createRoot(document.querySelector('#app')!);

root.render(
  <StrictMode>
    <div>Hello, Seahax!</div>
  </StrictMode>,
);
