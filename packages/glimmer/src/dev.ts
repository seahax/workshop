import { createGlimmer } from './glimmer.ts';

const canvas = document.querySelector<HTMLCanvasElement>('#canvas')!;
const context = canvas.getContext('2d')!;

createGlimmer(context, { resizeCanvas: 'hidpi' });
