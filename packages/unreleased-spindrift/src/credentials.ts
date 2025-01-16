import { fromNodeProviderChain } from '@aws-sdk/credential-providers';
import { type AwsCredentialIdentityProvider } from '@smithy/types';

interface Params {
  readonly profile: string | undefined;
}

export async function createCredentials({ profile }: Params): Promise<AwsCredentialIdentityProvider> {
  return fromNodeProviderChain({ profile, clientConfig: { region: 'us-east-1' } });
}
