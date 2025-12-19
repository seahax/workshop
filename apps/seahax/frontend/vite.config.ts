import mdx from '@mdx-js/rollup';
import prefetch from '@seahax/vite-plugin-prefetch';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

import projects from './config/projects.ts';

process.chdir(import.meta.dirname);

const sentry = process.env.SENTRY_AUTH_TOKEN
  ? sentryVitePlugin({
      org: 'seahax',
      project: 'seahax-frontend',
      authToken: process.env.SENTRY_AUTH_TOKEN,
    })
  : undefined;

console.log(`Sentry Vite Plugin: ${sentry ? 'enabled' : 'disabled'}`);

export default defineConfig((env) => {
  process.env.NODE_ENV ??= process.env.VITE_MODE ?? env.mode;

  return {
    mode: process.env.NODE_ENV,
    plugins: [react(), mdx(), sentry, prefetch()],
    build: {
      sourcemap: true,
      modulePreload: false,
      chunkSizeWarningLimit: 1000,
    },
    server: {
      host: '127.0.0.1',
    },
    define: {
      __PROJECTS__: JSON.stringify(projects),
    },
  };
});
