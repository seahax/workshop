import type { Renderer } from './renderer.ts';

export interface Options {
  /**
   * Particles per 960 pixels square (10 CSS inches, 960^2 pixels).
   *
   * Defaults to `1200`.
   */
  readonly count?: number;

  /**
   * The number of seconds that spawning the full particle count will take. On
   * startup, the particle are slowly spawned over this time until the required
   * number of particles is reached. This does not apply when replacing
   * particles that are removed.
   *
   * Defaults to `3`.
   */
  readonly spawnTime?: number;

  /**
   * The color that will be drawn on the canvas to clear it. To leave the
   * canvas "see-through" (no brackground color), set this to `"transparent"`.
   *
   * Defaults to `"transparent"`
   */
  readonly clearColor?: string;

  /**
   * Distance in pixels that particle links can reach.
   *
   * Defaults to `35`.
   */
  readonly linkDistance?: number;

  /**
   * _NOTE: The canvas CSS dimensions MUST be constrained or this may cause the
   * canvas to change size and shape unexpectedly!_
   *
   * If true, then the canvas size will be adjusted to match the canvas CSS
   * size when they don't match. If set to `hidpi`, then the scale will also be
   * adjusted to render at the display's native resolution. If set to false,
   * the canvas size and scale will not be changed by Glimmer, and must be
   * managed externally.
   *
   * Defaults to `true`.
   */
  readonly resizeCanvas?: boolean | 'hidpi';

  /**
   * Limit the framerate. Set to zero for unlimited.
   *
   * Defaults to `30`
   */
  readonly framerate?: number;

  /**
   * A renderer which defines particle and link appearance and behavior.
   */
  readonly renderer?: Renderer<any>;
}
