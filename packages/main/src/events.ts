import EventEmitter from 'node:events';

import { type LogLevel } from './log.js';

export const events = new EventEmitter<{
  beforeLog: [level: LogLevel | 'stdout' | 'stderr'];
  uncaughtError: [error: unknown];
}>();

export function initEvents(): void {
  process.on('uncaughtException', (error) => events.emit('uncaughtError', error));
  process.on('unhandledRejection', (error) => events.emit('uncaughtError', error));
}

events.on('uncaughtError', (error: any) => {
  process.exitCode ||= typeof error?.exitCode === 'number' ? error.exitCode : 1;
});
