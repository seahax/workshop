import fs from 'node:fs/promises';
import path from 'node:path';

import {
  CopyObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import mime from 'mime';

import { BUCKET_PREFIX_ARCHIVE, BUCKET_PREFIX_CURRENT } from '../constants/bucket-prefixes.js';
import { createResource } from '../resource.js';
import { collect } from '../utils/collect.js';
import { lookup } from '../utils/lookup.js';
import { map } from '../utils/map.js';
import { paginated } from '../utils/paginated.js';
import { slice } from '../utils/slice.js';
import { spinner } from '../utils/spinner.js';

interface Params {
  readonly s3BucketName: string;
  readonly source: string;
  readonly caching: Readonly<Record<string, string>>;
  readonly types: Readonly<Record<string, string>>;
}

export default createResource('S3 Bucket Objects', {
  async up({ createClient }, { s3BucketName, source, caching, types }: Params) {
    const client = createClient(S3Client);
    const localFilenames = await getLocalFilenames(source);
    const currentObjects = await getCurrentObjects(client, s3BucketName);

    { // COPY
      const keys = currentObjects.flatMap((object) => object.Key == null ? [] : [object.Key]);
      let i = 0;

      await collect(map(keys, async (sourceKey) => {
        const filename = path.posix.relative(BUCKET_PREFIX_CURRENT, sourceKey);
        const targetKey = `${BUCKET_PREFIX_ARCHIVE}${filename}`;
        console.debug(`copy ${filename}`);
        spinner.suffixText = `(copy ${++i}/${keys.length})`;
        await client.send(new CopyObjectCommand({
          Bucket: s3BucketName,
          Key: targetKey,
          CopySource: `${s3BucketName}/${sourceKey}`,
        }));
      }));
      spinner.suffixText = '';
    }

    { // PUT
      const getCustomCacheControl = lookup(caching);
      const getCustomContentType = lookup(types);
      let i = 0;

      await collect(map(localFilenames, async (filename) => {
        const absFilename = path.resolve(source, filename);
        const stats = await fs.stat(absFilename);

        if (!stats.isFile()) return;

        const targetKey = `${BUCKET_PREFIX_CURRENT}${filename}`;
        const handle = await fs.open(absFilename, 'r');
        const stream = handle.createReadStream({ autoClose: true });

        try {
          console.debug(`put ${filename}`);
          spinner.suffixText = `(put ${++i}/${localFilenames.size})`;
          await client.send(new PutObjectCommand({
            Bucket: s3BucketName,
            Key: targetKey,
            Body: stream,
            CacheControl: getCustomCacheControl(filename),
            ContentType: getCustomContentType(filename) ?? mime.getType(filename) ?? undefined,
          }));
          spinner.suffixText = '';
        }
        finally {
          stream.close();
          await handle.close();
        }
      }));
    }

    { // DELETE
      const deleteObjects = currentObjects.flatMap((object): { Key: string }[] => {
        if (object.Key == null) return [];
        if (localFilenames.has(path.posix.relative(BUCKET_PREFIX_CURRENT, object.Key))) return [];
        return [{ Key: object.Key }];
      });
      let i = 0;

      await collect(map(slice(deleteObjects, 1000), async (batch) => {
        batch.forEach((object) => console.debug(`delete ${object.Key}`));
        spinner.suffixText = `(delete ${i += batch.length}/${deleteObjects.length})`;
        await client.send(new DeleteObjectsCommand({
          Bucket: s3BucketName,
          Delete: { Objects: batch },
        }));
        spinner.suffixText = '';
      }));
    }
  },
});

async function getLocalFilenames(source: string): Promise<Set<string>> {
  return new Set(
    await fs.readdir(source, { recursive: true, encoding: 'utf8' })
      .then((filenames) => filenames.map((filename) => filename.replaceAll(path.sep, path.posix.sep))),
  );
}

async function getCurrentObjects(
  client: S3Client,
  s3BucketName: string,
): Promise<readonly { Key?: string }[]> {
  return await collect(paginated(async (ContinuationToken) => {
    const result = await client.send(new ListObjectsV2Command({
      Bucket: s3BucketName,
      MaxKeys: 1000,
      Prefix: BUCKET_PREFIX_CURRENT,
      ContinuationToken,
    }));

    return { values: result.Contents, next: result.ContinuationToken };
  }));
}
