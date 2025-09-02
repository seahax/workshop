import type { Vector } from './vector.ts';

export interface Particle {
  radius: number;
  position: Vector;
  removed: boolean;
}
