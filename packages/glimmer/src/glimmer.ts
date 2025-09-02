import { createLoop, type Loop } from './loop.ts';
import type { Options } from './options.ts';
import { createDefaultRenderer } from './renderer/default.ts';

export interface Glimmer {
  start(): void;
  stop(): void;
}

export function createGlimmer(
  context: CanvasRenderingContext2D,
  {
    count = 350,
    spawnTime = 3,
    clearColor = 'transparent',
    linkDistance = 60,
    resizeCanvas = true,
    framerate = 30,
    renderer = createDefaultRenderer(),
  }: Options = {},
): Glimmer {
  let loop: Loop | undefined;

  return {
    start() {
      loop ??= createLoop(context, { count, spawnTime, clearColor, linkDistance, resizeCanvas, framerate, renderer });
    },
    stop() {
      loop?.stop();
      loop = undefined;
    },
  };
}
