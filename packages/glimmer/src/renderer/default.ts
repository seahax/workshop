import { hslToRgb, rgbToCss } from '../color.ts';
import type { Particle } from '../particle.ts';
import type { Renderer } from '../renderer.ts';

export interface DefaultRendererParticle extends Particle {
  readonly createdTime: number;
  readonly rgb: readonly [r: number, g: number, b: number];
  readonly speed: number;
  age: number;
  alpha: number;
  transition: number;
  direction: number;
  expired: boolean;
}

export interface DefaultRendererOptions {
  /** Average (+/- 15) Hue component of the HSLA particle color. */
  readonly hue?: number;

  /** Saturation component of the HSLA particle color. */
  readonly saturation?: number;

  /** Lightness component of the HSLA particle color. */
  readonly lightness?: number;

  /** Alpha component of the HSLA particle color. */
  readonly alpha?: number;

  /** Average (+/- 50%) radius of each particle in pixels. */
  readonly radius?: number;

  /** Width of the lines connecting linked particles in pixels. */
  readonly linkWidth?: number;

  /** Average (+/- 66%) speed of each particle in pixels per second. */
  readonly speed?: number;

  /** The magnitude (0-1) of particle direction change per second. */
  readonly wobble?: number;

  /** If true, particles will have variable intensity. */
  readonly glimmer?: boolean;

  /** Fade particles out across the canvas (eg. `down` fades at the bottom). */
  readonly fade?: false | 'down' | 'up' | 'left' | 'right';

  /** Duration of particle fade in/out in milliseconds. */
  readonly transitionTime?: number;
}

export function createDefaultRenderer({
  hue = 216,
  saturation = 100,
  lightness = 70,
  alpha = 1,
  radius = 2,
  linkWidth = 0.5,
  speed = 15,
  wobble = 0.5,
  glimmer = true,
  fade = 'down',
  transitionTime = 1000,
}: DefaultRendererOptions = {}): Renderer<DefaultRendererParticle> {
  return {
    start({ viewport, time, options }) {
      let lowFrequencyUpdateCount = -Infinity;
      let isLowFrequencyUpdate = true;

      return {
        updateStart: () => {
          const count = Math.floor(time.elapsed / 100);
          isLowFrequencyUpdate = count > lowFrequencyUpdateCount;
          lowFrequencyUpdateCount = count;
        },
        createParticle: () => {
          const particle: DefaultRendererParticle = {
            createdTime: time.elapsed,
            age: 0,
            transition: 0,
            expired: false,
            radius: (radius * 0.5) + (Math.random() * radius * 0.5),
            rgb: hslToRgb(hue + ((Math.random() - 0.5) * 30), saturation, lightness),
            alpha: 1,
            speed: (speed * 0.333) + (speed * (Math.random() * 0.666)),
            direction: Math.random(),
            position: { x: viewport.width * Math.random(), y: viewport.height * Math.random() },
            removed: false,
          };

          updateGlimmer(particle);

          return particle;
        },
        updateParticle(particle) {
          particle.age = time.elapsed - particle.createdTime;
          updateGlimmer(particle);
          updateDirection(particle);

          if (particle.expired) {
            particle.transition = Math.max(0, particle.transition - (time.delta / transitionTime));
          }
          else if (Math.random() < 0.01 * time.delta / 1000) {
            particle.expired = true;
          }
          else if (particle.transition < 1) {
            particle.transition = Math.min(1, particle.transition + (time.delta / transitionTime));
          }

          const multiplier = particle.speed * (time.delta / 1000);
          particle.position.x += Math.cos(particle.direction * 2 * Math.PI) * multiplier;
          particle.position.y += Math.sin(particle.direction * 2 * Math.PI) * multiplier;

          particle.removed = (
            (particle.expired && particle.transition <= 0)
            || particle.position.x < -options.linkDistance
            || particle.position.x > viewport.width + options.linkDistance
            || particle.position.y < -options.linkDistance
            || particle.position.y > viewport.height + options.linkDistance
          );
        },
        renderParticle(context, particle) {
          const gradient = context.createRadialGradient(
            particle.position.x,
            particle.position.y,
            0,
            particle.position.x,
            particle.position.y,
            particle.radius,
          );

          const color = rgbToCss(...particle.rgb, particle.alpha * particle.transition);
          gradient.addColorStop(0.33, color);
          gradient.addColorStop(1, 'transparent');

          context.fillStyle = gradient;
          context.beginPath();
          context.arc(particle.position.x, particle.position.y, particle.radius, 0, Math.PI * 2, false);
          context.closePath();
          context.fill();
        },
        renderLink(context, particle0, particle1, strength) {
          const transition = Math.min(particle0.transition, particle1.transition);
          const color0 = rgbToCss(...particle0.rgb, particle0.alpha * transition * Math.pow(strength, 0.66));
          const color1 = rgbToCss(...particle1.rgb, particle1.alpha * transition * Math.pow(strength, 0.66));
          const gradient = context.createLinearGradient(
            particle0.position.x,
            particle0.position.y,
            particle1.position.x,
            particle1.position.y,
          );

          gradient.addColorStop(0, color0);
          gradient.addColorStop(1, color1);

          context.strokeStyle = gradient;
          context.lineWidth = linkWidth;
          context.beginPath();
          context.moveTo(particle0.position.x, particle0.position.y);
          context.lineTo(particle1.position.x, particle1.position.y);
          context.stroke();
          context.closePath();
        },
      };

      function updateGlimmer(particle: DefaultRendererParticle): void {
        if (!glimmer || !isLowFrequencyUpdate) return;

        let fadeValue = 0;

        if (fade === 'down') fadeValue = 1 - (particle.position.y / viewport.height);
        else if (fade === 'up') fadeValue = particle.position.y / viewport.height;
        else if (fade === 'right') fadeValue = 1 - (particle.position.x / viewport.width);
        else if (fade === 'left') fadeValue = particle.position.x / viewport.width;

        const alphaMax = Math.pow(Math.max(0, Math.min(1, fadeValue)), 1.75) * alpha;
        const alphaMin = 0.6 * alphaMax;
        const glimmerValue = ((Math.random() * 2) - 1) * 0.15;

        particle.alpha = Math.max(alphaMin, Math.min(alphaMax, particle.alpha + glimmerValue));
      }

      function updateDirection(particle: DefaultRendererParticle): void {
        if (!isLowFrequencyUpdate) return;

        particle.direction += ((Math.random() - 0.5) * (time.delta / 1000) * wobble);

        if (particle.direction > 1) particle.direction = particle.direction - 1;
        else if (particle.direction < 0) particle.direction = 1 + particle.direction;
      }
    },
  };
}
