import type { Particle } from './particle.ts';

export interface Hooks<TParticle extends Particle> {
  /**
   * Called (at most) once per frame, before particles and links are updated,
   * if the canvas was resized after the last frame.
   */
  readonly resize?: () => void;

  /**
   * Called once per frame, before particles and links are updated (or
   * created). May be used to initialize or reset per-frame state shared across
   * particles and links.
   */
  readonly updateStart?: () => void;

  /**
   * Create a new particle. New particles Particles will always be updated
   * (`updateParticle`) once before being rendered.
   */
  readonly createParticle: () => TParticle;

  /**
   * Update a single particle. Particles are updated in the order that they
   * were created.
   *
   * @param particle The particle.
   */
  readonly updateParticle?: (particle: TParticle) => void;

  /**
   * Update the the particles related to a link. Links are updated in the order
   * that particle0 was created, and after all individual particle updates.
   * Duplicate links will not occur, meaning that no two links will have the
   * same two particle endpoints.
   *
   * @param particle0 The particle at one end of the link.
   * @param particle1 The particle at the other end of the link.
   * @param strength Value from 0 to 1, where 0 means the particles are in the
   * same place, and 1 means the particles are at the maximum link distance.
   */
  readonly updateLink?: (particle0: TParticle, particle1: TParticle, strength: number) => void;

  /**
   * Called once per frame, after particles and links are updated (or created).
   * May be used to finalize per-frame state shared across particles and links.
   */
  readonly updateEnd?: () => void;

  /**
   * Called once per frame, before all other render methods. May be used to
   * render background elements.
   *
   * @param context 2D canvas rendering context.
   */
  readonly renderStart?: (context: CanvasRenderingContext2D | OffscreenRenderingContext) => void;

  /**
   * Render a single particle link. Links are rendered in the order that
   * particle0 was created, and before any particles are rendered. Duplicate
   * links will not occur, meaning that no two links will have the same two
   * particle endpoints.
   *
   * @param context 2D canvas rendering context.
   * @param particle0 The particle at one end of the link.
   * @param particle1 The particle at the other end of the link.
   * @param strength Value from 0 to 1, where 0 means the particles are in the
   * same place, and 1 means the particles are at the maximum link distance.
   */
  readonly renderLink?: (
    context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    particle0: TParticle,
    particle1: TParticle,
    strength: number
  ) => void;

  /**
   * Render a single particle. Particles are rendered in the order they were
   * created, and after all links have been rendered.
   *
   * @param context 2D canvas rendering context.
   * @param particle The particle.
   */
  readonly renderParticle?: (
    context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    particle: TParticle
  ) => void;

  /**
   * Called once per frame after all particles and links have been rendered.
   *
   * @param context 2D canvas rendering context.
   */
  readonly renderEnd?: (context: CanvasRenderingContext2D | OffscreenRenderingContext) => void;

  /**
   * Called when the Glimmer instance is stopped. After this hook is called,
   * no other hooks on the renderer will be called.
   */
  readonly stop?: () => void;
}
