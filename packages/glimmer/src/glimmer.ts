import type { Options } from './options.ts';
import type { Particle } from './particle.ts';
import { createDefaultRenderer } from './renderer/default.ts';
import { createSpace } from './space.ts';
import type { State } from './state.ts';

type Mutable<T> = T extends object ? {
  -readonly [P in keyof T]: T[P];
} : never;

export interface Glimmer {
  stop(): void;
}

const COUNT_PIXEL_AREA = 960;

export function createGlimmer(
  context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  {
    count: maxCount = 1000,
    spawnTime = 3,
    clearColor = 'transparent',
    linkDistance = 35,
    resizeCanvas = true,
    framerate = 30,
    renderer = createDefaultRenderer(),
  }: Options = {},
): Glimmer {
  const viewport: Mutable<State['viewport']> = {
    width: Number.NaN,
    height: Number.NaN,
    resized: true,
  };

  const time: Mutable<State['time']> = {
    elapsed: 0,
    delta: 0,
  };

  const count: Mutable<State['count']> = {
    current: 0,
    max: 0,
  };

  const state: State = {
    viewport,
    time,
    count,
    options: {
      count: maxCount,
      spawnTime,
      clearColor,
      linkDistance,
      resizeCanvas,
      framerate,
      renderer,
    },
  };
  const particles = new Set<Particle>();
  const canvas = context.canvas;

  const {
    resize,
    updateStart,
    createParticle,
    updateParticle,
    updateLink,
    updateEnd,
    renderStart,
    renderLink,
    renderParticle,
    renderEnd,
  } = renderer.start(state);

  const minElapsedDelta = framerate <= 0 ? 0 : 1000 / (framerate + 0.5);

  let space = createSpace({ divisionSize: 10, xMin: 0, xMax: 0, yMin: 0, yMax: 0 });
  let createCountRemainder = 0;
  let replaceCount = 0;
  let pixelRatio = 1;
  let animationFrame = requestAnimationFrame((startTime) => {
    tick(startTime);

    function tick(currentTime: number): void {
      const elapsed = currentTime - startTime;
      const delta = elapsed - time.elapsed;

      if (delta >= minElapsedDelta) {
        time.elapsed = elapsed;
        time.delta = delta;
        onTick();
      }

      animationFrame = requestAnimationFrame(tick);
    }
  });

  return {
    stop: () => {
      cancelAnimationFrame(animationFrame);
      return time.elapsed;
    },
  };

  function onTick(): void {
    viewport.resized = false;
    let isPixelRatioChanged = false;
    let isCanvasResized = false;

    if (typeof window !== 'undefined') {
      if (resizeCanvas === 'hidpi') {
        const newPixelRatio = Math.max(1, window.devicePixelRatio);
        isPixelRatioChanged = newPixelRatio !== pixelRatio;
        pixelRatio = newPixelRatio;
      }

      if (resizeCanvas && 'style' in canvas && canvas.width < (window.screen.width + 2) * pixelRatio) {
        const expectedWidth = canvas.offsetWidth * pixelRatio;
        const expectedHeight = canvas.offsetHeight * pixelRatio;

        if (canvas.width !== expectedWidth) {
          canvas.width = expectedWidth;
          isCanvasResized = true;
        }

        if (canvas.height !== expectedHeight) {
          canvas.height = expectedHeight;
          isCanvasResized = true;
        }
      }
    }

    const newWidth = Math.ceil(canvas.width / pixelRatio);
    const newHeight = Math.ceil(canvas.height / pixelRatio);

    viewport.resized = viewport.width !== newWidth || viewport.height !== newHeight;
    viewport.width = newWidth;
    viewport.height = newHeight;

    if (viewport.resized) {
      particles.clear();
      space = createSpace({
        divisionSize: 20,
        xMin: -linkDistance,
        xMax: linkDistance + viewport.width,
        yMin: -linkDistance,
        yMax: linkDistance + viewport.height,
      });
      resize?.();
    }

    count.current = particles.size;
    count.max = Math.ceil(maxCount * (viewport.width / COUNT_PIXEL_AREA) * (viewport.height / COUNT_PIXEL_AREA));

    updateStart?.();

    for (const particle of particles) {
      updateParticle?.(particle);
      space.add(particle);
    }

    let createCount = spawnTime > 0
      ? replaceCount + Math.min(
        Math.max(0, count.max - count.current),
        ((count.max * time.delta) / (spawnTime * 1000)) + createCountRemainder,
      )
      : Math.max(0, count.max - count.current);

    for (; createCount >= 1; --createCount) {
      const particle = createParticle();
      particles.add(particle);
      space.add(particle);
    }

    const links: [Particle, Particle, number][] = [];

    if (linkDistance > 0 && (updateLink || renderLink)) {
      const visited = new Set<Particle>();

      for (const particle0 of particles) {
        visited.add(particle0);

        if (particle0.removed) continue;

        const linkedParticleResults = space.find(particle0.position.x, particle0.position.y, linkDistance);

        for (const { particle: particle1, distance } of linkedParticleResults) {
          if (distance === 0) continue;
          if (particle1.removed) continue;
          if (visited.has(particle1)) continue;

          const strength = (linkDistance - distance) / linkDistance;

          links.push([particle0, particle1, strength]);

          if (updateLink) {
            updateLink(particle0, particle1, strength);
            space.add(particle0);
            space.add(particle1);
          }
        }
      }
    }

    createCountRemainder = createCount;

    updateEnd?.();

    if (isPixelRatioChanged || isCanvasResized) {
      context.reset();
      context.scale(pixelRatio, pixelRatio);
    }

    context.clearRect(0, 0, viewport.width, viewport.height);

    if (clearColor !== 'transparent') {
      context.save();
      context.fillStyle = clearColor;
      context.fillRect(0, 0, viewport.width, viewport.height);
      context.restore();
    }

    if (renderStart) {
      context.save();
      renderStart(context);
      context.restore();
    }

    if (renderLink) {
      for (const [particle0, particle1, strength] of links) {
        context.save();
        renderLink(context, particle0, particle1, strength);
        context.restore();
      }
    }

    replaceCount = 0;

    for (const particle of Array.from(particles)) {
      if (particle.removed) {
        particles.delete(particle);
        space.delete(particle);
        replaceCount += 1;
        continue;
      }

      if (renderParticle) {
        context.save();
        renderParticle(context, particle);
        context.restore();
      }
    }

    if (renderEnd) {
      context.save();
      renderEnd(context);
      context.restore();
    }
  }
}
