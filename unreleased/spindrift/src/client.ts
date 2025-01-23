import { type User } from './user.js';

type ClientFactory = (user: User, region: string) => object;

export function createClientFactory<TClientFactory extends ClientFactory>(
  factory: TClientFactory,
): TClientFactory {
  return factory;
}

export function itemsWithQuantity<const T extends readonly unknown[] | undefined, V = T>(
  items?: T,
  map: (item: Exclude<T, undefined>[number]) => V = (item) => item as V,
): { Quantity: number; Items: V[] | undefined } {
  return { Quantity: items?.length ?? 0, Items: items?.map(map) };
}
