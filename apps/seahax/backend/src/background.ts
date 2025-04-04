import { createBackground } from '@seahax/background';
import * as sentry from '@sentry/node';

interface BackgroundOptions {
  readonly task: string;
  readonly failureSeverity?: sentry.SeverityLevel;
}

export const background = createBackground((error, { task, failureSeverity }: BackgroundOptions) => {
  sentry.captureException(error, { tags: { background_task: task }, level: failureSeverity });
});
