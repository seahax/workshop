import { createMiddlewareFilter } from '@seahax/espresso';
import helmetMiddleware from 'helmet';

import { config } from '../service/config.ts';

console.log(helmetMiddleware.contentSecurityPolicy.getDefaultDirectives());

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
      'img-src': [
        "'self'", 'data:',
        // Required for Auth0 (Wordpress/Gravatar) profile pictures.
        'https://*.gravatar.com', 'https://*.wp.com', 'https://cdn.auth0.com',
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
