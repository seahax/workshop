import type { Entity } from '../entity.ts';

export interface State {
  readonly entities: Readonly<Record<`${string}:${number}:${number}`, Entity>>;
}
