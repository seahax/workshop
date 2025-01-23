import { createBucketClient } from '../clients/bucket.js';
import { createResource } from '../resource.js';

export default createResource({
  title: 'CDN > Bucket Policy',

  async up({ config, user, components }) {
    const bucket = components.getRequired('bucket');
    const cdn = components.getRequired('cdn');
    const client = createBucketClient(user, config.region);

    await client.putSimplePolicy(bucket.name, {
      AllowCloudFrontServicePrincipalReadOnly: {
        principal: { Service: 'cloudfront.amazonaws.com' },
        actions: ['s3:GetObject'],
        prefix: '*',
        condition: {
          StringEquals: {
            'AWS:SourceArn': `arn:aws:cloudfront::${user.accountId}:distribution/${cdn.id}`,
          },
        },
      },
    });
  },
});
