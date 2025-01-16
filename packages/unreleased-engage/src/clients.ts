import { type AwsCredentialIdentityProvider } from '@smithy/types';

interface ClientParams {
  region: string;
  credentials: AwsCredentialIdentityProvider;
}

export type ClientConstructor = new (config: ClientParams) => any;
export type InferClientOptions<TConstructor extends ClientConstructor> = ConstructorParameters<TConstructor>[0];

export interface Clients {
  create<TConstructor extends ClientConstructor>(
    this: void,
    ctor: TConstructor,
    ...[config]: undefined extends InferClientOptions<TConstructor>
      ? [config?: InferClientOptions<TConstructor>]
      : [config: InferClientOptions<TConstructor>]
  ): InstanceType<TConstructor>;
}

export function createClients({ region, credentials }: ClientParams): Clients {
  return {
    create(ctor, config) {
      return new ctor({
        ...config,
        region: config?.region ?? region,
        credentials: config?.credentials ?? credentials,
      });
    },
  };
}
