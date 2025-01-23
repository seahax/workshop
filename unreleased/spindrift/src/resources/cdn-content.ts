import fs from 'node:fs/promises';
import path from 'node:path';

import { createBucketClient, normalizeKey } from '../clients/bucket.js';
import { createResource } from '../resource.js';
import { collect } from '../utils/collect.js';
import { lookup } from '../utils/lookup.js';
import { map } from '../utils/map.js';
import { CDN_BUCKET_PREFIX_ARCHIVE, CDN_BUCKET_PREFIX_CURRENT } from './bucket.js';

export default createResource({
  title: 'CDN > Content',

  async up({ config, user, components, task }) {
    const bucket = components.getRequired('bucket');
    const client = createBucketClient(user, config.region);
    const [filenames, currentKeys] = await Promise.all([
      getFilenames(),
      client.listObjects(`${bucket.name}/${CDN_BUCKET_PREFIX_CURRENT}`),
    ]);
    const updatedKeys = new Set(filenames.map((filename) => normalizeKey(filename)));
    const outdatedKeys = currentKeys.filter((key) => !updatedKeys.has(key));
    const archiveCounter = task.counter({ prefix: 'Archive ', total: outdatedKeys.length });
    const syncCounter = task.counter({ prefix: 'Sync ', total: filenames.length + outdatedKeys.length });

    // Archive
    await client.copyObjects(
      `${bucket.name}/${CDN_BUCKET_PREFIX_CURRENT}`,
      `${bucket.name}/${CDN_BUCKET_PREFIX_ARCHIVE}`,
      outdatedKeys,
      { onCopy: () => archiveCounter.increment() },
    );

    // Sync (Put)
    await client.putFiles(
      `${bucket.name}/${CDN_BUCKET_PREFIX_CURRENT}`,
      filenames,
      {
        dir: config.cdn.source,
        cacheControl: lookup(config.cdn.caching),
        contentType: lookup(config.cdn.types),
        onPut: () => syncCounter.increment(),
      },
    );

    // Sync (Delete)
    await client.deleteObjects(
      `${bucket.name}/${CDN_BUCKET_PREFIX_CURRENT}`,
      outdatedKeys,
      { onDelete: ({ length }) => syncCounter.increment(length) },
    );

    async function getFilenames(): Promise<string[]> {
      const filenames = await fs.readdir(config.cdn.source, { recursive: true, encoding: 'utf8' });

      return await collect(map(filenames, async (filename) => {
        const stats = await fs.stat(path.resolve(config.cdn.source, filename));
        return stats.isFile() ? filename : undefined;
      }));
    }
  },
});
