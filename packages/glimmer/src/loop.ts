import type { Options } from './options.ts';
import type { Particle } from './particle.ts';
import type { State } from './state.ts';

type Mutable<T> = T extends object ? {
  -readonly [P in keyof T]: T[P];
} : never;

export interface Loop {
  stop(): number;
}

const COUNT_PIXEL_AREA = 960;

export function createLoop(
  context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  options: Required<Options>,
): Loop {
  const {
    count: maxCount,
    spawnTime,
    clearColor,
    linkDistance,
    resizeCanvas,
    framerate,
    renderer,
  } = options;

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

  const state: State = { viewport, time, count, options };
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

      if (resizeCanvas && 'style' in canvas && canvas.width / pixelRatio < window.screen.width) {
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
      resize?.();
    }

    count.current = particles.size;
    count.max = Math.ceil(maxCount * (viewport.width / COUNT_PIXEL_AREA) * (viewport.height / COUNT_PIXEL_AREA));

    updateStart?.();

    let createCount = spawnTime > 0
      ? replaceCount + Math.min(
        Math.max(0, count.max - count.current),
        ((count.max * time.delta) / (spawnTime * 1000)) + createCountRemainder,
      )
      : Math.max(0, count.max - count.current);

    for (; createCount >= 1; --createCount) {
      const particle = createParticle();
      particles.add(particle);
    }

    createCountRemainder = createCount;
    replaceCount = 0;

    const particlesArray = Array.from(particles);

    for (const particle of particlesArray) {
      updateParticle?.(particle);

      if (particle.removed) {
        particles.delete(particle);
      }
    }

    const links: [Particle, Particle, number][] = [];

    if (updateLink || renderLink) {
      for (let i = 0; i < particlesArray.length; ++i) {
        for (let j = i + 1; j < particlesArray.length; ++j) {
          const particle0 = particlesArray[i]!;
          const particle1 = particlesArray[j]!;
          let strength = 1 - Math.hypot(
            particle0.position.x - particle1.position.x,
            particle0.position.y - particle1.position.y,
          ) / linkDistance;

          if (strength < 0) continue;

          updateLink?.(particle0, particle1, strength);

          strength = 1 - Math.hypot(
            particle0.position.x - particle1.position.x,
            particle0.position.y - particle1.position.y,
          ) / linkDistance;

          if (strength < 0) continue;

          links.push([particle0, particle1, strength]);
        }
      }
    }

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

    for (const particle of particlesArray) {
      if (renderParticle) {
        context.save();
        renderParticle(context, particle);
        context.restore();
      }

      if (particle.removed) {
        particles.delete(particle);
        replaceCount += 1;
      }
    }

    if (renderEnd) {
      context.save();
      renderEnd(context);
      context.restore();
    }
  }
}
