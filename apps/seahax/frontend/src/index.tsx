import './init/sentry.ts';
import './init/fonts.ts';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';

import RouteError from './routes/error.tsx';
import Root from './routes/root.tsx';
import { lazyRoute } from './routes/util/lazy-route.tsx';

const router = createBrowserRouter([
  {
    path: '/',
    Component: Root,
    ErrorBoundary: RouteError,
    HydrateFallback: () => null,
    children: [
      lazyRoute({ index: true, lazy: () => import('./routes/home.tsx') }),
    ],
  },
]);

createRoot(document.querySelector('#app')!, { onUncaughtError: () => undefined }).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
