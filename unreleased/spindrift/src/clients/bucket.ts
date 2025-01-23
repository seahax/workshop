import assert from 'node:assert';
import fs from 'node:fs/promises';
import path from 'node:path';

import {
  BucketAlreadyExists,
  BucketAlreadyOwnedByYou,
  CopyObjectCommand,
  CreateBucketCommand,
  DeleteBucketCommand,
  DeleteObjectsCommand,
  type LifecycleRule,
  ListObjectsV2Command,
  NoSuchBucket,
  PutBucketLifecycleConfigurationCommand,
  PutBucketOwnershipControlsCommand,
  PutBucketPolicyCommand,
  PutBucketTaggingCommand,
  PutObjectCommand,
  S3Client,
  waitUntilBucketExists,
  waitUntilBucketNotExists,
} from '@aws-sdk/client-s3';
import { type StreamingBlobPayloadInputTypes } from '@smithy/types';
import mime from 'mime';

import { createClientFactory } from '../client.js';
import { collect } from '../utils/collect.js';
import { map } from '../utils/map.js';
import { paginated } from '../utils/paginated.js';
import { silence } from '../utils/silence.js';
import { slice } from '../utils/slice.js';

export const createBucketClient = createClientFactory(({ credentials }, region) => {
  const client = new S3Client({ region, credentials });
  const self = {
    async create(name: string): Promise<boolean> {
      const result = await silence(
        [BucketAlreadyExists, BucketAlreadyOwnedByYou],
        client.send(new CreateBucketCommand({ Bucket: name })),
      );

      await client.send(new PutBucketOwnershipControlsCommand({
        Bucket: name,
        OwnershipControls: {
          Rules: [
            { ObjectOwnership: 'BucketOwnerEnforced' },
          ],
        },
      }));

      await waitUntilBucketExists({ client, maxWaitTime: 900, maxDelay: 30, minDelay: 5 }, { Bucket: name });

      return Boolean(result);
    },

    async putTagging(name: string, tags: Readonly<Record<string, string>>) {
      await client.send(new PutBucketTaggingCommand({
        Bucket: name,
        Tagging: { TagSet: Object.entries(tags).map(([Key, Value]) => ({ Key, Value })) },
      }));
    },

    async putLifecycle(name: string, rules: readonly Partial<LifecycleRule>[]) {
      await client.send(new PutBucketLifecycleConfigurationCommand({
        Bucket: name,
        LifecycleConfiguration: {
          Rules: rules.map((rule) => ({
            ...rule,
            Filter: rule.Filter
              ? { ...rule.Filter, Prefix: normalizeKeyPrefix(rule.Filter.Prefix) }
              : undefined,
            Status: rule.Status ?? 'Enabled',
          })),
        },
      }));
    },

    async putPolicy(name: string, policy: Readonly<Record<string, unknown>>) {
      await client.send(new PutBucketPolicyCommand({ Bucket: name, Policy: JSON.stringify(policy) }));
    },

    async putSimplePolicy(name: string, statements: Readonly<Record<string, {
      readonly prefix?: string;
      readonly effect?: 'Allow' | 'Deny';
      readonly actions: string | readonly string[];
      readonly principal: '*' | Readonly<Record<string, unknown>>;
      readonly condition?: Readonly<Record<string, unknown>>;
    }>>): Promise<void> {
      await self.putPolicy(name, {
        Version: '2012-10-17',
        Statement: Object.entries(statements)
          .map(([Sid, { prefix = '', effect = 'Allow', actions, principal, condition }]) => {
            const prefixNormal = normalizeKey(prefix);
            return ({
              Sid,
              Effect: effect,
              Principal: principal,
              Action: actions,
              Resource: `arn:aws:s3:::${name}${prefixNormal ? `/${prefixNormal}` : ''}`,
              Condition: condition,
            });
          }),
      });
    },

    async listObjects(bucketWithPrefix: string) {
      const [name, prefix] = parseBucketWithKey(bucketWithPrefix);

      return await collect(paginated(async (ContinuationToken) => {
        const result = await client.send(new ListObjectsV2Command({
          Bucket: name,
          MaxKeys: 1000,
          Prefix: normalizeKeyPrefix(prefix),
          ContinuationToken,
        }));
        const values = result.Contents?.map((object) => object.Key && relativeKey(prefix, object.Key));

        return { values, next: result.ContinuationToken };
      }));
    },

    async copyObject(from: `${string}/${string}`, to: `${string}/${string}`) {
      const [name, key] = parseBucketWithKey(to);

      await client.send(new CopyObjectCommand({
        Bucket: normalizeKey(name),
        Key: normalizeKey(key),
        CopySource: normalizeKey(from),
      }));
    },

    async copyObjects(
      fromBucketWithPrefix: string,
      toBucketWithPrefix: string,
      keys: Iterable<string> | AsyncIterable<string>,
      { onCopy }: {
        readonly onCopy?: (key: string) => void;
      } = {},
    ) {
      await collect(map(keys, async (key) => {
        await self.copyObject(`${fromBucketWithPrefix}/${key}`, `${toBucketWithPrefix}/${key}`);
        onCopy?.(key);
      }));
    },

    async putObject(
      bucketWithPrefix: string,
      key: string,
      body: StreamingBlobPayloadInputTypes,
      { cacheControl, contentType }: {
        readonly cacheControl?: string;
        readonly contentType?: string;
      } = {},
    ) {
      const [name, prefix] = parseBucketWithKey(bucketWithPrefix);

      await client.send(new PutObjectCommand({
        Bucket: name,
        Key: normalizeKey(path.posix.join(prefix, key)),
        Body: body,
        CacheControl: cacheControl,
        ContentType: contentType ?? mime.getType(key) ?? undefined,
      }));
    },

    async putFile(
      bucketWithPrefix: string,
      filename: string,
      { dir = '.', ...options }: {
        readonly dir?: string;
        readonly cacheControl?: string;
        readonly contentType?: string;
      } = {},
    ) {
      const absFilename = path.resolve(dir, filename);
      const relFilename = path.relative(dir, absFilename);

      assert(relFilename, 'Filename is outside of the directory.');

      const handle = await fs.open(absFilename, 'r');
      const stream = handle.createReadStream({ autoClose: true });

      try {
        await self.putObject(bucketWithPrefix, relFilename, stream, options);
      }
      finally {
        stream.close();
        await handle.close();
      }
    },

    async putFiles(
      bucketWithPrefix: string,
      filenames: Iterable<string> | AsyncIterable<string>,
      { dir, cacheControl, contentType, onPut }: {
        readonly dir?: string;
        readonly cacheControl?: string | ((filename: string) => string | undefined);
        readonly contentType?: string | ((filename: string) => string | undefined);
        readonly onPut?: (filename: string) => void;
      } = {},
    ) {
      await collect(map(filenames, async (filename) => {
        await self.putFile(bucketWithPrefix, filename, {
          dir: dir,
          cacheControl: typeof cacheControl === 'function' ? cacheControl(filename) : cacheControl,
          contentType: typeof contentType === 'function' ? contentType(filename) : contentType,
        });
        onPut?.(filename);
      }));
    },

    async deleteObjects(
      bucketWithPrefix: string,
      keys: Iterable<string> | AsyncIterable<string>,
      { onDelete }: {
        readonly onDelete?: (keys: string[]) => void;
      } = {},
    ) {
      const [name, prefix] = parseBucketWithKey(bucketWithPrefix);

      await collect(map(slice(keys, 1000), async (batch) => {
        await client.send(new DeleteObjectsCommand({
          Bucket: name,
          Delete: {
            Objects: batch.map((key) => ({
              Key: normalizeKey(path.posix.join(prefix, key)),
            })),
          },
        }));
        onDelete?.(batch);
      }));
    },

    async delete(name: string) {
      const result = await silence([NoSuchBucket], async () => {
        const keys = await self.listObjects(name);
        await self.deleteObjects(name, keys);
        return await client.send(new DeleteBucketCommand({ Bucket: name }));
      });

      await waitUntilBucketNotExists({ client, maxWaitTime: 900, maxDelay: 30, minDelay: 5 }, { Bucket: name });

      return Boolean(result);
    },
  } as const;

  return self;
});

export function parseBucketWithKey(value: string): [name: string, key: string] {
  const name = value.split('/')[0]!;
  const key = normalizeKey(value.slice(name.length));

  return [name, key];
}

export function normalizeKey(pathString: string): string {
  return relativeKey(undefined, pathString);
}

function normalizeKeyPrefix(prefix = ''): string | undefined {
  const value = normalizeKey(prefix);
  return value ? `${value}/` : undefined;
}

function relativeKey(prefix: string | undefined, key: string): string {
  return path.posix.relative(
    `/${prefix?.replaceAll(path.sep, '/') ?? ''}`,
    `/${key.replaceAll(path.sep, '/')}`,
  );
}
