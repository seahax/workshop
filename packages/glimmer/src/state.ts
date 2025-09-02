import type { Options } from './options.ts';

export interface State {
  readonly viewport: {
    /**
     * Width of the rendering context in logical pixels (aka: DIPS, device
     * independent pixels, CSS pixels). There are roughly 96 logical pixels per
     * inch.
     */
    readonly width: number;

    /**
     * Height of the rendering context in logical pixels (aka: DIPS, device
     * independent pixels, CSS pixels). There are roughly 96 logical pixels per
     * inch.
     */
    readonly height: number;

    /**
     * True if the rendering dimensions have changed since the previous frame.
     */
    readonly resized: boolean;
  };

  readonly time: {
    /**
     * Number of milliseconds since the first frame. May be fractional with
     * precision down to the microsecond. Does not include time when the renderer
     * was stopped (paused).
     */
    readonly elapsed: number;

    /**
     * Number of milliseconds since the last frame. May be fractional with
     * precision down to the microsecond. Does not inclue time when the renderer
     * was stopped (paused).
     */
    readonly delta: number;
  };

  readonly count: {
    /**
     * The current number of particles.
     */
    readonly current: number;

    /**
     * The maximum number of particles that should be rendered given the canvas
     * size.
     */
    readonly max: number;
  };

  /**
   * Options provided to Glimmer, with defaults injected.
   */
  readonly options: Required<Options>;
}
