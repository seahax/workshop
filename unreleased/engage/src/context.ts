import { type Clients } from './clients.js';
import { type Components } from './components.js';
import { spinner } from './utils/spinner.js';

interface ContextParams {
  readonly appId: string;
  readonly accountId: string;
  readonly region: string;
  readonly components: Components;
  readonly clients: Clients;
}

export interface Context extends Pick<ContextParams, 'appId' | 'accountId' | 'region'> {
  /**
   * Get the component ID for the given type and (optional) name. If the
   * component doesn't exist, then `undefined` is returned.
   */
  getComponentId: Components['getId'];

  /**
   * Get the component ID for the given type and name. If the component doesn't
   * exist, create it.
   */
  requireComponentId: Components['requireId'];

  /**
   * Create an AWS client with config defaults (region, credentials).
   */
  createClient: Clients['create'];

  /**
   * Register a cleanup callback to be invoked (in reverse order) just before
   * the command completes.
   */
  cleanup: (callback: () => Promise<void>) => void;
}

export function createContext({
  appId,
  accountId,
  region,
  components,
  clients,
}: ContextParams): [ctx: Context, ctxCleanup: () => Promise<void>] {
  const cleanupCallbacks: (() => Promise<void>)[] = [];
  const ctx: Context = {
    appId,
    accountId,
    region,
    async getComponentId(type, name) {
      return await components.getId(type, name);
    },
    async requireComponentId(type, name) {
      return await components.requireId(type, name);
    },
    createClient(ctor, ...args) {
      return clients.create(ctor, ...args);
    },
    cleanup(callback) {
      cleanupCallbacks.unshift(callback);
    },
  };

  async function ctxCleanup(): Promise<void> {
    spinner.suffixText = '';
    spinner.start('Cleanup');

    try {
      for (const callback of cleanupCallbacks) {
        await callback();
      }

      spinner.suffixText = '';
      spinner.succeed();
    }
    catch (error) {
      spinner.fail();
      spinner.suffixText = '';
      throw error;
    }
  }

  return [ctx, ctxCleanup];
}
