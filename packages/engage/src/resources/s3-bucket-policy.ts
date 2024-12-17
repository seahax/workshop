import { PutBucketPolicyCommand, S3Client } from '@aws-sdk/client-s3';

import { createResource } from '../resource.js';

interface Params {
  readonly distributionId: string;
}

export default createResource('S3 Bucket Policy', {
  async up({ app, createClient, getAccountId }, { distributionId }: Params) {
    const client = createClient(S3Client);
    const accountId = await getAccountId();

    await client.send(new PutBucketPolicyCommand({
      Bucket: `e4e-${app}-${accountId}`,
      Policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: {
          Sid: 'AllowCloudFrontServicePrincipalReadOnly',
          Effect: 'Allow',
          Principal: {
            Service: 'cloudfront.amazonaws.com',
          },
          Action: 's3:GetObject',
          Resource: `arn:aws:s3:::e4e-${app}-${accountId}/*`,
          Condition: {
            StringEquals: {
              'AWS:SourceArn': `arn:aws:cloudfront::${accountId}:distribution/${distributionId}`,
            },
          },
        },
      }),
    }));
  },
});
