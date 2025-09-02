import { createGlimmer } from './glimmer.ts';

const canvas = document.querySelector<HTMLCanvasElement>('#canvas')!;
const context = canvas.getContext('2d')!;
const glimmer = createGlimmer(context, { resizeCanvas: 'hidpi' });

glimmer.start();
