import { PutBucketPolicyCommand, S3Client } from '@aws-sdk/client-s3';

import { createResource } from '../resource.js';

interface Params {
  readonly s3BucketName: string;
  readonly cloudFrontDistributionId: string;
}

export default createResource('S3 Bucket Policy', {
  async up({ accountId, createClient }, { s3BucketName, cloudFrontDistributionId }: Params) {
    const client = createClient(S3Client);

    await client.send(new PutBucketPolicyCommand({
      Bucket: s3BucketName,
      Policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: {
          Sid: 'AllowCloudFrontServicePrincipalReadOnly',
          Effect: 'Allow',
          Principal: {
            Service: 'cloudfront.amazonaws.com',
          },
          Action: 's3:GetObject',
          Resource: `arn:aws:s3:::${s3BucketName}/*`,
          Condition: {
            StringEquals: {
              'AWS:SourceArn': `arn:aws:cloudfront::${accountId}:distribution/${cloudFrontDistributionId}`,
            },
          },
        },
      }),
    }));
  },
});
