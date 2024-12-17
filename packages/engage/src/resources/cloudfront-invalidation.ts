import { randomUUID } from 'node:crypto';

import { CloudFrontClient, CreateInvalidationCommand } from '@aws-sdk/client-cloudfront';

import { createResource } from '../resource.js';

interface Params {
  readonly distributionId: string;
}

export default createResource('CloudFront Invalidation', {
  async up({ createClient }, { distributionId }: Params) {
    const client = createClient(CloudFrontClient);

    await client.send(new CreateInvalidationCommand({
      DistributionId: distributionId,
      InvalidationBatch: {
        CallerReference: randomUUID(),
        Paths: {
          Quantity: 1,
          Items: ['/*'],
        },
      },
    }));
  },
});
