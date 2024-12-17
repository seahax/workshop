import assert from 'node:assert';

import { GetCallerIdentityCommand, STSClient } from '@aws-sdk/client-sts';
import { fromNodeProviderChain } from '@aws-sdk/credential-providers';
import { type AwsCredentialIdentityProvider } from '@smithy/types';

import { lazy } from './utils/lazy.js';

interface ClientConfig { credentials: AwsCredentialIdentityProvider; region: string | undefined }
type ClientConstructor = new (config: ClientConfig) => any;
type InferClientOptions<TConstructor extends ClientConstructor> = ConstructorParameters<TConstructor>[0];

export interface ContextConfig {
  readonly app: string;
  readonly region: string;
  readonly profile: string | undefined;
}

export class Context {
  readonly app: string;
  readonly region: string;
  readonly profile: string | undefined;
  readonly credentials: AwsCredentialIdentityProvider;

  constructor({ app, region, profile }: ContextConfig) {
    this.app = app;
    this.region = region;
    this.profile = profile;
    this.credentials = fromNodeProviderChain({
      profile: this.profile,
      clientConfig: { region: this.region },
    });
  }

  readonly createClient = <TConstructor extends ClientConstructor>(
    ctor: TConstructor,
    ...[config]: undefined extends InferClientOptions<TConstructor>
      ? [config?: InferClientOptions<TConstructor>]
      : [config: InferClientOptions<TConstructor>]
  ): InstanceType<TConstructor> => {
    return new ctor({
      ...config,
      region: config?.region ?? this.region,
      credentials: config?.credentials ?? this.credentials,
    });
  };

  readonly getAccountId = lazy(async () => {
    const sts = this.createClient(STSClient);
    const { Account } = await sts.send(new GetCallerIdentityCommand());

    assert(Account, `No AWS credentials available.`);

    return Account;
  });
}
