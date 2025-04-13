import { createBackground } from '@seahax/background';

import { captureException } from './sentry.ts';

export const background = createBackground((error, task: string) => {
  captureException(error, { tags: { background_task: task }, level: 'warning' });
});
