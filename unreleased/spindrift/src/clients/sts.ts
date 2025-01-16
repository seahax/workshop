import assert from 'node:assert';

import { GetCallerIdentityCommand, STSClient } from '@aws-sdk/client-sts';

import { createClientFactory } from '../client.js';
import { lazy } from '../utils/lazy.js';

export interface Identity {
  readonly accountId: string;
  readonly userId: string;
  readonly userArn: string;
}

export const createStsClient = createClientFactory((credentials) => {
  const client = new STSClient({ region: 'us-east-1', credentials });

  return {
    getIdentity: lazy(async () => {
      const result = await client.send(new GetCallerIdentityCommand());

      assert(result.Account, `Missing identity account ID.`);
      assert(result.UserId, `Missing identity user ID.`);
      assert(result.Arn, `Missing identity user ARN.`);

      return {
        accountId: result.Account,
        userId: result.UserId,
        userArn: result.Arn,
      } satisfies Identity;
    }),
  };
});
