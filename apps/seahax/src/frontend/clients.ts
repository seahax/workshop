import { initClient } from '@ts-rest/core';

import { authApi } from '../apis/auth.ts';

export const authClient = initClient(authApi, {
  baseUrl: window.location.origin,
  throwOnUnknownStatus: true,
});
