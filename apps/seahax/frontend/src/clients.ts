import { initClient } from '@ts-rest/core';
import { authApiContract } from 'app-seahax-api';

export const authClient = initClient(authApiContract, {
  baseUrl: new URL('/auth', window.location.origin).href,
  throwOnUnknownStatus: true,
  validateResponse: true,
});
