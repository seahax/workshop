import * as sentry from '@sentry/node';

sentry.init({
  dsn: 'https://8bccefc6c967115a3f7f41cb478fa2fd@o4509086879973376.ingest.us.sentry.io/4509086892949504',
});

export const captureException = sentry.captureException;
