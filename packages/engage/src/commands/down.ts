import { Context } from '../context.js';
import cloudfrontDistribution from '../resources/cloudfront-distribution.js';
import cloudfrontOriginAccessControl from '../resources/cloudfront-origin-access-control.js';
import cloudfrontResponseHeadersPolicy from '../resources/cloudfront-response-headers-policy.js';
import cloudwatchDelivery from '../resources/cloudwatch-delivery.js';
import cloudwatchDeliveryDestination from '../resources/cloudwatch-delivery-destination.js';
import cloudwatchDeliverySource from '../resources/cloudwatch-delivery-source.js';
import cloudwatchLogGroup from '../resources/cloudwatch-log-group.js';
import s3Bucket from '../resources/s3-bucket.js';
import s3BucketObjects from '../resources/s3-bucket-objects.js';
import { type ResolvedConfig } from '../types/config.js';
import { lock } from '../utils/lock.js';

export default async function down({ app, aws }: ResolvedConfig): Promise<void> {
  const { region, profile } = aws;
  const ctx = new Context({ app, region, profile });

  await lock(ctx, async () => {
    await cloudwatchDelivery.down(ctx);
    await cloudwatchDeliveryDestination.down(ctx);
    await cloudwatchDeliverySource.down(ctx);
    await cloudwatchLogGroup.down(ctx);
    await cloudfrontDistribution.down(ctx);
    await cloudfrontResponseHeadersPolicy.down(ctx);
    await cloudfrontOriginAccessControl.down(ctx);
    await s3BucketObjects.down(ctx);
    await s3Bucket.down(ctx);
  });
}
