/* eslint-disable unicorn/no-process-exit */
import sourceMapSupport from 'source-map-support';

import { events, initEvents } from './events.js';
import { initLog } from './log.js';

async function main(action: () => void | Promise<void>): Promise<never> {
  if ('called' in main) throw new Error('The main function can only be called once.');

  Object.assign(main, { called: true });
  sourceMapSupport.install();
  initLog();
  initEvents();

  try {
    await action();
  }
  catch (error: any) {
    if (error?.name !== 'AbortError') {
      events.emit('uncaughtError', error);
    }
  }

  return process.exit();
}

export default Object.assign(main, {
  events,
});
