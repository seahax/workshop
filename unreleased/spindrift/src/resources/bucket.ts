import { createBucketClient } from '../clients/bucket.js';
import { type ComponentKey } from '../data/components.js';
import { createResource, RESOURCE_APP_TAG } from '../resource.js';

export const CDN_BUCKET_PREFIX_CURRENT = '.current';
export const CDN_BUCKET_PREFIX_ARCHIVE = '.archive';

export default createResource({
  title: 'Buckets',

  async up({ config, user, app, components, task }) {
    const client = createBucketClient(user, config.region);
    const entries = Object.entries(config.buckets);
    const counter = task.counter({ total: entries.length + 1 });

    // Always one bucket for the CDN.
    const { name, isNew } = await create('bucket');

    if (isNew) {
      await client.putLifecycle(name, [{
        ID: 'ExpireArchivedContent',
        Filter: { Prefix: CDN_BUCKET_PREFIX_ARCHIVE },
        Expiration: { Days: 365 },
      }]);
    }

    for (const [key] of entries) {
      await create(`bucket.${key}`);
    }

    async function create(key: ComponentKey<'bucket'>): Promise<{ name: string; isNew: boolean }> {
      const { meta: { name }, isNew } = await components.resolve(key, async (meta) => {
        const name = meta?.name ?? await components.createId();
        const isNew = await client.create(name);
        return { meta: { name }, isNew };
      });

      await components.resolve(key, { name });

      if (isNew) {
        const appId = await app.resolve();
        await client.putTagging(name, { [RESOURCE_APP_TAG]: appId });
      }

      counter.increment();

      return { name, isNew };
    }
  },

  async cleanup({ config, user, components, task }) {
    const client = createBucketClient(user, config.region);
    const buckets = await components.query('bucket');
    const entries = [...buckets.entries()].filter(([key]) => !components.isResolved(key));
    const counter = task.counter({ total: entries.length });

    for (const [key, { name }] of entries) {
      await client.delete(name);
      await components.delete(key);
      counter.increment();
    }
  },

  async down({ config, user, components, task }) {
    const client = createBucketClient(user, config.region);
    const buckets = await components.query('bucket');
    const entries = [...buckets.entries()];
    const counter = task.counter({ total: entries.length });

    for (const [key, { name }] of entries) {
      await client.delete(name);
      await components.delete(key);
      counter.increment();
    }
  },
});
