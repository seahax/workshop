import assert from 'node:assert';

import { type ResolvedConfig } from './config.js';
import { type App, createApp, createAppKey } from './data/app.js';
import { type Components, createComponents } from './data/components.js';
import { createLock } from './data/lock.js';
import { getUser, type User } from './user.js';

export interface Context {
  readonly config: ResolvedConfig;
  readonly user: User;
  readonly app: App;
  readonly components: Components;
}

export async function withContext<T>(
  config: ResolvedConfig,
  callback: (context: Context) => Promise<T>,
): Promise<T> {
  const appKey = createAppKey(config);
  const user = await getUser({ profile: config.auth.profile });
  const { credentials } = user;

  assert(
    config.auth.accounts.length <= 0 || config.auth.accounts.includes(user.accountId),
    `Account ID "${user.accountId}" is not allowed by the configuration.`,
  );

  const lock = await createLock({ appKey, credentials });

  try {
    const app = await createApp({ appKey, credentials });
    const components = await createComponents({ appKey, app, credentials });

    return await callback({ config, user, app, components });
  }
  finally {
    await lock.delete();
  }
}
