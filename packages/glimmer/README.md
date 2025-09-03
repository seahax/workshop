# @seahax/glimmer

Just a fun visual effects project using particles on a canvas.

Inspired by the venerable [particles.js](https://vincentgarreau.com/particles.js/).

See it on Codepen: https://codepen.io/ChrisAckerman/pen/myeaJQv

## Usage

Create or get a convas element and a 2D rendering context.

```ts
const canvas = document.querySelector('#my-canvas') as HTMLCanvasElement;
const context = canvas.getContext('2d')!;
```

Start a glimmer.

```ts
import { createGlimmer } from '@seahax/glimmer';

const glimmer = createGlimmer(context);
```

Stop the glimmer when you're done. A new glimmer must be created to restart.

```ts
glimmer.stop();
```

## Options

The following options can be set when creating the Glimmer instance. None of the options are required, but the defaults are shown here for educational purposes.

```ts
import { createDefaultRenderer } from '@seahax/glimmer';

const glimmer = createGlimmer(canvas, {

  // Particle count per 10 CSS inches squared (960^2 pixels).
  count: 1000,

  // Number of seconds that it will take to spawn the full pixel count.
  spawnTime: 3,

  // The background color used to fill the canvas before each draw. Using
  // transparent allows the canvas to be see-through.
  clearColor: 'transparent',

  // The range in pixels for particle links.
  linkDistance: 35,

  // Whether or not to set the canvas rendering size to match the canvas
  // CSS size. Set this to `"hidpi"` to also adjust the canvas scale to match
  // the display (requires canvas CSS size constraints).
  resizeCanvas: true,

  // Limit the framerate. Set to zero for unlimited.
  framerate: 30,

  // A renderer which updates and draws the particles each frame.
  renderer: createDefaultRenderer(),
});
```

## Default Renderer

The default renderer supports limited customization. The following options are the defaults.

```ts
createDefaultRenderer({

  // Average (+/- 15) Hue component of the HSLA particle color.
  hue: 216,

  // Saturation component of the HSLA particle color.
  saturation: 100,

  // Lightness component of the HSLA particle color.
  lightness: 70,

  // Alpha component of the HSLA particle color.
  alpha: 0.8,

  // Average (+/- 50%) radius of each particle in pixels.
  radius: 2,

  // Width of the lines connecting linked particles in pixels.
  linkWidth: 0.5,

  // Average (+/- 66%) speed of each particle in pixels per second.
  speed: 15,

  // The magnitude (0-1) of particle direction changes per second.
  wobble: 0.5,

  // If true, particles will have variable intensity.
  glimmer: true,

  // Fade particles out across the canvas (eg. `down` fades at the bottom).
  fade: 'down',

  // Duration of particle fade in/out in milliseconds.
  transitionTime: 1000;

});
```

## Custom Renderer

For greater customization, a custom renderer can be defined.

```ts
import type { Renderer, Particle } from `@seahax/glimmer`;

export function createMyRenderer(): Renderer<TParticle> {
  return {

    // Called to get rendering hooks when a Glimmer instance is started.
    start(state) {

      // Only the `createParticle` hook is required. All others are optional.
      // The following hooks are in the order they are called per frame.
      return {

        // Called (first) if the canvas was resized after the last frame.
        resize: (): void => { ... },

        // Update start.
        updateStart: (): void => { ... },

        // Update a single particle.
        updateParticle: (
          particle: TParticle
        ): void => { ... },

        // Create a new particle.
        createParticle: (): TParticle => { ... },

        // Update the the particles related to a link (attract, repulse, etc).
        updateLink: (
          particle0: TParticle,
          particle1: TParticle,
          strength: number
        ): void => { ... },

        // Render start.
        renderStart: (
          context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
          ): void => { ... },

        // Render a single particle link.
        renderLink: (
          context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
          particle0: TParticle,
          particle1: TParticle,
          strength: number
        ): void => { ... },

        // Render a single particle.
        renderParticle: (
          context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
          particle: TParticle
        ): void => { ... },

        // Render end.
        renderEnd: (
          context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
        ): void => { ... },

        // Rendering stopped. The above hooks will not be called after this.
        stop: (): void => { ... },
      }
    }
  }
}
```
