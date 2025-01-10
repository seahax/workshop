import { createBucketClient } from '../clients/bucket.js';
import { createResource } from '../resource.js';

export default createResource({
  title: 'CDN > Bucket Policy',

  async up({ config, sts, components, credentials }) {
    const bucket = components.getRequired('bucket');
    const cdn = components.getRequired('cdn');
    const client = createBucketClient(credentials, config.region);
    const identity = await sts.getIdentity();

    await client.putSimplePolicy(bucket.name, {
      AllowCloudFrontServicePrincipalReadOnly: {
        principal: { Service: 'cloudfront.amazonaws.com' },
        actions: ['s3:GetObject'],
        prefix: '*',
        condition: {
          StringEquals: {
            'AWS:SourceArn': `arn:aws:cloudfront::${identity.accountId}:distribution/${cdn.id}`,
          },
        },
      },
    });
  },
});
