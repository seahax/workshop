import assert from 'node:assert';

import { type AwsCredentialIdentityProvider } from '@smithy/types';

import { createStsClient } from './clients/sts.js';
import { type ResolvedConfig } from './config.js';
import { createCredentials } from './credentials.js';
import { type App, createApp, createAppKey } from './data/app.js';
import { type Components, createComponents } from './data/components.js';
import { createLock } from './data/lock.js';

export interface Context {
  readonly config: ResolvedConfig;
  readonly sts: ReturnType<typeof createStsClient>;
  readonly app: App;
  readonly components: Components;
  readonly credentials: AwsCredentialIdentityProvider;
}

export async function withContext<T>(
  config: ResolvedConfig,
  callback: (context: Context) => Promise<T>,
): Promise<T> {
  const appKey = createAppKey(config);
  const credentials = await createCredentials(config.auth);
  const sts = createStsClient(credentials);
  const identity = await sts.getIdentity();

  assert(
    config.auth.accounts.length <= 0 || config.auth.accounts.includes(identity.accountId),
    `Account ID "${identity.accountId}" is not allowed by the configuration.`,
  );

  const lock = await createLock({ appKey, credentials });

  try {
    const app = await createApp({ appKey, credentials });
    const components = await createComponents({ appKey, app, credentials });

    return await callback({ config, sts, app, components, credentials });
  }
  finally {
    await lock.delete();
  }
}
