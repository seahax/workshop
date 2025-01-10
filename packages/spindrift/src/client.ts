import { type AwsCredentialIdentityProvider } from '@smithy/types';

type ClientFactoryGlobal = (credentials: AwsCredentialIdentityProvider) => object;
type ClientFactory = (credentials: AwsCredentialIdentityProvider, region: string) => object;

export function createClientFactory<TClientFactory extends ClientFactory>(
  factory: TClientFactory,
): TClientFactory;
export function createClientFactory<TClientFactory extends ClientFactoryGlobal>(
  factory: TClientFactory,
): TClientFactory;
export function createClientFactory(
  factory: ClientFactoryGlobal | ClientFactory,
): ClientFactoryGlobal | ClientFactory {
  return factory;
}

export function itemsWithQuantity<const T extends readonly unknown[] | undefined, V = T>(
  items?: T,
  map: (item: Exclude<T, undefined>[number]) => V = (item) => item as V,
): { Quantity: number; Items: V[] | undefined } {
  return { Quantity: items?.length ?? 0, Items: items?.map(map) };
}
