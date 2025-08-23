import lib from '@seahax/vite-plugin-lib';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import { defineConfig, type Plugin } from 'vite';

process.chdir(import.meta.dirname);

const sentry: Plugin | undefined = process.env.SENTRY_AUTH_TOKEN
  ? sentryVitePlugin({
      org: 'seahax',
      project: 'seahax-backend',
      authToken: process.env.SENTRY_AUTH_TOKEN,
    })
  : undefined;

console.log(`Sentry Vite Plugin: ${sentry ? 'enabled' : 'disabled'}`);

export default defineConfig({
  plugins: [
    lib({ runtime: 'node', bundle: { minify: false } }),
    sentry,
  ],
});
