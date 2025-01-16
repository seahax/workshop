import { GetCallerIdentityCommand, STSClient } from '@aws-sdk/client-sts';
import { type AwsCredentialIdentityProvider } from '@smithy/types';

import { assert } from './utils/assert.js';

interface Params {
  readonly credentials: AwsCredentialIdentityProvider;
}

export async function getAccountId({ credentials }: Params): Promise<string> {
  const client = new STSClient({ credentials, region: 'us-east-1' });
  const { Account } = await client.send(new GetCallerIdentityCommand());

  assert(Account, `Missing identity account ID.`);

  return Account;
}
