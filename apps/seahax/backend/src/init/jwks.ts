import { interval } from '@seahax/interval';

import { getJwkRepository } from '../auth/repository/jwks.ts';
import { background } from '../services/background.ts';

// Try an initial rotation when the service starts. This should also ensure
// that the JWKS doc is created if it doesn't exist.
background(async () => {
  await getJwkRepository().rotateKeys();
}, 'init-jwks');

// Try a rotation every day. No-op if the rotation is unnecessary.
setInterval(() => {
  background(async () => {
    await getJwkRepository().rotateKeys();
  }, 'rotate-jwks');
}, interval('1 day').as('milliseconds')).unref();
