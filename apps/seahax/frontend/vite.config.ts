import prefetch from '@seahax/vite-plugin-prefetch';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

process.chdir(import.meta.dirname);

const sentry = process.env.SENTRY_AUTH_TOKEN
  ? sentryVitePlugin({
      org: 'seahax',
      project: 'seahax-frontend',
      authToken: process.env.SENTRY_AUTH_TOKEN,
    })
  : undefined;

console.log(`Sentry Vite Plugin: ${sentry ? 'enabled' : 'disabled'}`);

export default defineConfig({
  plugins: [react(), sentry, prefetch()],
  build: {
    sourcemap: true,
    modulePreload: false,
  },
});
