import type { Hooks } from './hooks.ts';
import type { Particle } from './particle.ts';
import type { State } from './state.ts';

export interface Renderer<TParticle extends Particle> {
  start(state: State): Hooks<TParticle>;
}
