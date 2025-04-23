import { createBackground } from '@seahax/background';

import { captureError } from './sentry.ts';

export const background = createBackground((error, task: string) => {
  captureError(error, { tags: { background_task: task }, level: 'warning' });
});
