import { fromNodeProviderChain } from '@aws-sdk/credential-providers';
import { type AwsCredentialIdentityProvider } from '@smithy/types';

interface Params {
  readonly profile: string | undefined;
}

export function getCredentials({ profile }: Params): AwsCredentialIdentityProvider {
  return fromNodeProviderChain({
    profile,
    clientConfig: { region: 'us-east-1' },
  });
}
