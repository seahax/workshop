import { initClient } from '@seahax/ts-rest-client';
import { authApiContract } from 'app-seahax-api';

export const authClient = initClient(authApiContract, '/auth');
