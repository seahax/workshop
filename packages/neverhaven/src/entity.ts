import type { Direction } from './direction.ts';

export interface Entity {
  readonly id: string;
  readonly type: EntityType;
  readonly name: string;
  readonly description: string;
  readonly health?: number;
  readonly healthMax?: number;
  readonly damage?: Readonly<Partial<Record<EntityDamage, number>>>;
  readonly resistance?: Readonly<Partial<Record<EntityDamage, number>>>;
  readonly size?: EntitySize;
  readonly parent?: EntityRef;
  readonly contents?: readonly EntityRef[];
  readonly attachments?: Readonly<Partial<Record<string, EntityRef[]>>>;
  readonly sides?: Readonly<Partial<Record<Direction, EntityRef>>>;
}

export type EntityType = (
  | 'room'
  | 'side'
  | 'weapon'
  | 'tool'
  | 'consumable'
  | 'creature'
);

export type EntityDamage = (
  | 'slashing'
  | 'piercing'
  | 'bludgeoning'
  | 'fire'
  | 'ice'
  | 'lightning'
  | 'poison'
  | 'acid'
);

/**
 * Entity t-shirt sizes. Numeric values roughly translate to cubic centimeters
 * and/or grams.
 */
export enum EntitySize {
  /**
   * Coin sized (1 cm cubed, 1 gram).
   */
  xxs = 1,
  /**
   * Meal sized (10 cm cubed, 1 kg).
   */
  xs = 10 ^ 3,
  /**
   * Weapon sized (20 cm cubed, 8 kg).
   */
  s = 20 ^ 3,
  /**
   * Backpack sized (30 cm cubed, 27 kg).
   */
  m = 30 ^ 3,
  /**
   * Person sized (1/2 meter cubed, 124 kg).
   */
  l = 50 ^ 3,
  /**
   * Horse sized (1 meter cubed, 1 metric ton).
   */
  xl = 100 ^ 3,
  /**
   * Elephant sized (1.5 meters cubed, 3.375 metric tons).
   */
  xxl = 150 ^ 3,
  /**
   * Dragon sized (5 meters cubed, 125 metric tons).
   */
  huge = 500 ^ 3,
}

export interface EntityRef {
  readonly entityId: string;
}
