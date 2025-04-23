import * as Sentry from '@sentry/node';

interface CaptureOptions {
  readonly level?: Sentry.SeverityLevel;
  readonly tags?: Readonly<Record<string, string | number | bigint | boolean>>;
}

Sentry.init({
  dsn: 'https://8bccefc6c967115a3f7f41cb478fa2fd@o4509086879973376.ingest.us.sentry.io/4509086892949504',
});

export function captureError(error: unknown, options?: CaptureOptions): void {
  Sentry.captureException(error, options);
};

export function captureMessage(message: string, options?: CaptureOptions): void {
  Sentry.captureMessage(message, options);
};
