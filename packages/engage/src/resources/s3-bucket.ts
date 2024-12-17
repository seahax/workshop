import {
  type BucketLocationConstraint,
  CreateBucketCommand,
  DeleteBucketCommand,
  PutBucketLifecycleConfigurationCommand,
  PutBucketOwnershipControlsCommand,
  PutBucketTaggingCommand,
  S3Client,
  waitUntilBucketExists,
} from '@aws-sdk/client-s3';

import { BUCKET_PREFIX_ARCHIVE } from '../constants/bucket-prefixes.js';
import { TAG_NAME } from '../constants/tags.js';
import { createResource } from '../resource.js';
import { silence } from '../utils/silence.js';

export default createResource('S3 Bucket', {
  async up({ app, region, createClient, getAccountId }) {
    const accountId = await getAccountId();
    const client = createClient(S3Client);

    await silence(
      ['BucketAlreadyExists', 'BucketAlreadyOwnedByYou'],
      client.send(new CreateBucketCommand({
        Bucket: `e4e-${app}-${accountId}`,
        ACL: 'private',
        CreateBucketConfiguration: {
          LocationConstraint: region as BucketLocationConstraint,
        },
      })));

    await waitUntilBucketExists(
      { client, maxWaitTime: 900, maxDelay: 30, minDelay: 5 },
      { Bucket: `e4e-${app}-${accountId}` },
    );

    await client.send(new PutBucketTaggingCommand({
      Bucket: `e4e-${app}-${accountId}`,
      Tagging: { TagSet: [{ Key: TAG_NAME, Value: app }] },
    }));

    await client.send(new PutBucketLifecycleConfigurationCommand({
      Bucket: `e4e-${app}-${accountId}`,
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

    await client.send(new PutBucketOwnershipControlsCommand({
      Bucket: `e4e-${app}-${accountId}`,
      OwnershipControls: {
        Rules: [
          { ObjectOwnership: 'BucketOwnerEnforced' },
        ],
      },
    }));
  },

  async down({ app, createClient, getAccountId }): Promise<void> {
    const accountId = await getAccountId();
    const client = createClient(S3Client);

    await client.send(new DeleteBucketCommand({ Bucket: `e4e-${app}-${accountId}` }));
  },
});
