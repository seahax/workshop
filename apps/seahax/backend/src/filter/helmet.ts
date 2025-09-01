import { createMiddlewareFilter } from '@seahax/espresso';
import helmetMiddleware from 'helmet';

import { config } from '../service/config.ts';

const helmetDefault = helmetMiddleware({
  contentSecurityPolicy: {
    directives: {
      'connect-src': [
        ...helmetMiddleware.contentSecurityPolicy.getDefaultDirectives()['connect-src'] ?? [],
        // Required for Auth0 PKCE auth code exchange.
        'https://auth0.seahax.com',
        // Required for Sentry reporting.
        'https://*.sentry.io',
      ],
      'img-src': [
        ...helmetMiddleware.contentSecurityPolicy.getDefaultDirectives()['img-src'] ?? [],
        // Required for Auth0 profile pictures.
        'https://*.gravatar.com',
      ],
      'upgrade-insecure-requests': config.environment === 'development' ? null : [],
    },
  },
});

const helmetSharedResources = helmetMiddleware({
  crossOriginResourcePolicy: {
    policy: 'cross-origin',
  },
});

export const helmet = createMiddlewareFilter((request, response, next) => {
  switch (request.url) {
    case '/seahax.jpg': {
      return helmetSharedResources(request, response, next);
    }
    default: {
      return helmetDefault(request, response, next);
    }
  }
});
