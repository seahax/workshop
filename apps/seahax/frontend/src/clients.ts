import { initClient } from '@ts-rest/core';
import { authRouterSpec } from 'app-seahax-api';

export const authClient = initClient(authRouterSpec, {
  baseUrl: window.location.origin,
  throwOnUnknownStatus: true,
  validateResponse: true,
});
