import { initTsRestClient } from '@seahax/ts-rest-client';
import { authRoutes } from 'app-seahax-api';

export const authClient = initTsRestClient(authRoutes, window.location.origin);
