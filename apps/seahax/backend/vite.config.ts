import lib from '@seahax/vite-plugin-lib';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import { defineConfig } from 'vite';

process.chdir(import.meta.dirname);

export default defineConfig({
  plugins: [
    lib({ entry: 'src/index.ts', target: 'node', bundle: true, extraExternals: ['mongodb-memory-server'] }),
    sentryVitePlugin({
      org: 'personal-4a3',
      project: 'seahax-backend',
      authToken: process.env.SENTRY_AUTH_TOKEN,
      disable: !process.env.SENTRY_AUTH_TOKEN,
    }),
  ],
});
