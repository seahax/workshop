import { GetCallerIdentityCommand, STSClient } from '@aws-sdk/client-sts';
import { fromNodeProviderChain } from '@aws-sdk/credential-providers';
import { type AwsCredentialIdentityProvider } from '@smithy/types';

interface Params {
  readonly profile: string | undefined;
}

export interface User {
  readonly credentials: AwsCredentialIdentityProvider;
  readonly accountId: string;
  readonly id: string;
  readonly arn: string;
}

export async function getUser({ profile }: Params): Promise<User> {
  const credentials = fromNodeProviderChain({ profile, clientConfig: { region: 'us-east-1' } });
  const sts = new STSClient({ region: 'us-east-1', credentials });
  const identity = await sts.send(new GetCallerIdentityCommand());

  return {
    credentials,
    accountId: identity.Account!,
    id: identity.UserId!,
    arn: identity.Arn!,
  };
}
