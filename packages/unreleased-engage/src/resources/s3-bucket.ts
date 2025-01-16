import {
  type BucketLocationConstraint,
  CreateBucketCommand,
  DeleteBucketCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
  PutBucketLifecycleConfigurationCommand,
  PutBucketOwnershipControlsCommand,
  S3Client,
  waitUntilBucketExists,
} from '@aws-sdk/client-s3';

import { BUCKET_PREFIX_ARCHIVE } from '../constants/bucket-prefixes.js';
import { type Context } from '../context.js';
import { createResource } from '../resource.js';
import { collect } from '../utils/collect.js';
import { map } from '../utils/map.js';
import { paginated } from '../utils/paginated.js';
import { silence } from '../utils/silence.js';
import { slice } from '../utils/slice.js';

export default createResource('S3 Bucket', {
  async up({ appId, accountId, region, createClient }) {
    const client = createClient(S3Client);
    const name = getBucketName({ accountId, appId });
    const result = await silence(
      ['BucketAlreadyExists', 'BucketAlreadyOwnedByYou'],
      client.send(new CreateBucketCommand({
        Bucket: name,
        ACL: 'private',
        CreateBucketConfiguration: {
          LocationConstraint: region as BucketLocationConstraint,
        },
      })));

    await waitUntilBucketExists(
      { client, maxWaitTime: 900, maxDelay: 30, minDelay: 5 },
      { Bucket: name },
    );

    if (result) {
      await client.send(new PutBucketOwnershipControlsCommand({
        Bucket: name,
        OwnershipControls: {
          Rules: [
            { ObjectOwnership: 'BucketOwnerEnforced' },
          ],
        },
      }));

      await client.send(new PutBucketLifecycleConfigurationCommand({
        Bucket: name,
        LifecycleConfiguration: {
          Rules: [
            {
              ID: 'ExpireArchivedContent',
              Filter: { Prefix: BUCKET_PREFIX_ARCHIVE },
              Expiration: { Days: 365 },
              Status: 'Enabled',
            },
          ],
        },
      }));
    }

    return { s3BucketName: name };
  },

  async down({ appId, accountId, createClient }): Promise<void> {
    const client = createClient(S3Client);
    const name = getBucketName({ accountId, appId });

    // Empty
    {
      const objects = await collect(paginated(async (ContinuationToken) => {
        const result = await client.send(new ListObjectsV2Command({
          Bucket: name,
          MaxKeys: 1000,
          ContinuationToken,
        }));

        return { values: result.Contents, next: result.ContinuationToken };
      }));

      await collect(map(slice(objects, 1000), async (batch) => {
        await client.send(new DeleteObjectsCommand({
          Bucket: name,
          Delete: {
            Objects: batch.map((object) => ({
              Key: object.Key!,
            })),
          },
        }));
      }));
    }

    await client.send(new DeleteBucketCommand({ Bucket: name }));
  },

  async get({ appId, accountId }) {
    return { s3BucketName: getBucketName({ accountId, appId }) };
  },
});

function getBucketName({ accountId, appId }: Pick<Context, 'accountId' | 'appId'>): string {
  return `engage-${accountId}-${appId}`;
}
