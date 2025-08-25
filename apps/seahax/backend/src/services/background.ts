import { createBackground } from '@seahax/background';
import { captureException, captureMessage } from '@sentry/node';

export const background = createBackground((error, task: string, isFatal?: boolean) => {
  console.warn(`Background task "${task}" failed (${new Date().toUTCString()}):`, error);
  captureException(error, { tags: { background_task: task }, level: isFatal ? 'error' : 'warning' });

  if (isFatal) {
    // eslint-disable-next-line unicorn/no-process-exit
    process.exit(1);
  }
})
  .onBegin((task) => {
    console.log(`Background task "${task}" started (${new Date().toUTCString()}).`);
    captureMessage(`Background task "${task}" started.`, { tags: { background_task: task }, level: 'debug' });
  })
  .onSuccess((task) => {
    console.log(`Background task "${task}" succeeded (${new Date().toUTCString()}).`);
    captureMessage(`Background task "${task}" succeeded.`, { tags: { background_task: task }, level: 'debug' });
  });
