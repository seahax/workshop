import { initClient } from '@ts-rest/core';
import { authRouterSpec } from 'app-seahax-api';

export const authClient = initClient(authRouterSpec, {
  baseUrl: new URL('/auth', window.location.origin).href,
  throwOnUnknownStatus: true,
  validateResponse: true,
});
