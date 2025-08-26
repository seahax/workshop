import { createMiddlewareFilter } from '@seahax/espresso';
import helmetMiddleware from 'helmet';

const helmetDefault = helmetMiddleware({
  contentSecurityPolicy: {
    directives: {
      'connect-src': [
        "'self'",
        // Required for Auth0 PKCE auth code exchange.
        'https://auth0.seahax.com',
        // Required for Sentry reporting.
        'https://*.sentry.io',
      ],
    },
  },
});

const helmetShared = helmetMiddleware({
  crossOriginResourcePolicy: {
    policy: 'cross-origin',
  },
  contentSecurityPolicy: {
    directives: {
      'connect-src': [
        "'self'",
        // Required for Auth0 PKCE auth code exchange.
        'https://auth0.seahax.com',
        // Required for Sentry reporting.
        'https://*.sentry.io',
      ],
    },
  },
});

export const helmet = createMiddlewareFilter((request, response, next) => {
  switch (request.url) {
    case '/seahax.jpg': {
      return helmetShared(request, response, next);
    }
    default: {
      return helmetDefault(request, response, next);
    }
  }
});
