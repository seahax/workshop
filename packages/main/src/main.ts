/* eslint-disable unicorn/no-process-exit */
import { nextTick } from 'node:process';

import sourceMapSupport from 'source-map-support';

import { events, initEvents } from './events.ts';
import { initLog } from './log.ts';

function main(action: () => void | Promise<void>): void {
  if ('called' in main) throw new Error('The main function can only be called once.');

  Object.assign(main, { called: true });
  sourceMapSupport.install();
  initLog();
  initEvents();

  // Using nextTick prevents "used before defined" issues.
  void new Promise<void>((resolve) => nextTick(() => resolve()))
    .then(action).catch((error: unknown) => {
      if ((error as any)?.name !== 'AbortError') {
        events.emit('uncaughtError', error);
      }
    })
    .finally(() => {
      // When the action resolves, the process must exit.
      return process.exit();
    });
}

export default Object.assign(main, {
  events,
});
