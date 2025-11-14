import * as sentry from '@sentry/react';

sentry.init({
  dsn: 'https://c7a75ff7a98d2ca889b5fb5c549046ed@o4509086879973376.ingest.us.sentry.io/4509087149326336',
  environment: window.location.hostname === 'seahax.com' ? 'production' : 'development',
  sendDefaultPii: true,
});
