import { initClient } from '@ts-rest/core';

import { authRouterSpec } from '../common/routers/auth.ts';

export const authClient = initClient(authRouterSpec, {
  baseUrl: window.location.origin,
  throwOnUnknownStatus: true,
});
