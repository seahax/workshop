import Color from 'color';

import type { Particle } from '../particle.ts';
import type { Renderer } from '../renderer.ts';

export interface DefaultRendererParticle extends Particle {
  readonly createdTime: number;
  age: number;
  expired: boolean;
  transition: number;
  color: string;
  speed: number;
  direction: number;
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
  speed = 30,
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
          return {
            createdTime: time.elapsed,
            age: 0,
            transition: 0,
            expired: false,
            radius: 0,
            color: 'magenta',
            speed: 0,
            direction: 0,
            position: { x: viewport.width * Math.random(), y: viewport.height * Math.random() },
            removed: false,
          };
        },
        updateParticle(particle) {
          particle.age = time.elapsed - particle.createdTime;
          particle.radius = getRadius(particle);
          particle.color = getColor(particle);
          particle.speed = getSpeed(particle);
          particle.direction = getDirection(particle);

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
          const color = Color(particle.color) ?? [];
          const radius = getRadius(particle);
          const gradient = context.createRadialGradient(
            particle.position.x,
            particle.position.y,
            0,
            particle.position.x,
            particle.position.y,
            particle.radius,
          );

          color.alpha(color.alpha() * particle.transition).string();
          gradient.addColorStop(0.33, color.alpha(color.alpha() * particle.transition).string());
          gradient.addColorStop(1, color.alpha(0).string());

          context.fillStyle = gradient;
          context.beginPath();
          context.arc(particle.position.x, particle.position.y, radius, 0, Math.PI * 2, false);
          context.closePath();
          context.fill();
        },
        renderLink(context, particle0, particle1, strength) {
          const color0 = Color(particle0.color);
          const color1 = Color(particle1.color);
          const transition = Math.min(particle0.transition, particle1.transition);
          const gradient = context.createLinearGradient(
            particle0.position.x,
            particle0.position.y,
            particle1.position.x,
            particle1.position.y,
          );

          gradient.addColorStop(0, color0.alpha(color0.alpha() * Math.pow(strength, 0.66) * transition).string());
          gradient.addColorStop(1, color1.alpha(color0.alpha() * Math.pow(strength, 0.66) * transition).string());

          context.strokeStyle = gradient;
          context.lineWidth = linkWidth;
          context.beginPath();
          context.moveTo(particle0.position.x, particle0.position.y);
          context.lineTo(particle1.position.x, particle1.position.y);
          context.stroke();
          context.closePath();
        },
      };

      function getColor(particle: DefaultRendererParticle): string {
        let fadeValue = 0;

        if (fade === 'down') fadeValue = 1 - (particle.position.y / viewport.height);
        else if (fade === 'up') fadeValue = particle.position.y / viewport.height;
        else if (fade === 'right') fadeValue = 1 - (particle.position.x / viewport.width);
        else if (fade === 'left') fadeValue = particle.position.x / viewport.width;

        const alphaMax = Math.pow(Math.max(0, Math.min(1, fadeValue)), 1.75) * alpha;
        const alphaMin = 0.6 * alphaMax;

        let color = particle.age === 0
          ? Color.hsl(hue + ((Math.random() - 0.5) * 30), saturation, lightness, (alphaMax + alphaMin) / 2)
          : Color(particle.color);

        if (glimmer && isLowFrequencyUpdate) {
          const glimmerValue = ((Math.random() * 2) - 1) * 0.15;
          color = color.alpha(Math.max(alphaMin, Math.min(alphaMax, color.alpha() + glimmerValue)));
        }

        return color.string();
      }

      function getRadius(particle: DefaultRendererParticle): number {
        return particle.age === 0
          ? ((radius * 0.5) + (Math.random() * radius * 0.5))
          : particle.radius;
      }

      function getSpeed(particle: DefaultRendererParticle): number {
        return particle.age === 0
          ? ((speed * 0.333) + (speed * (Math.random() * 0.666)))
          : particle.speed;
      }

      function getDirection(particle: DefaultRendererParticle): number {
        if (particle.age === 0) {
          return Math.random();
        }

        if (!isLowFrequencyUpdate) return particle.direction;

        const newDirection = particle.direction + ((Math.random() - 0.5) * (time.delta / 1000) * wobble);

        if (newDirection > 1) return newDirection - 1;
        if (newDirection < 0) return 1 + newDirection;

        return newDirection;
      }
    },
  };
}
