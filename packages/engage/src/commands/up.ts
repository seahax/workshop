import { Context } from '../context.js';
import cloudfrontDistribution from '../resources/cloudfront-distribution.js';
import cloudfrontInvalidation from '../resources/cloudfront-invalidation.js';
import cloudfrontOriginAccessControl from '../resources/cloudfront-origin-access-control.js';
import cloudfrontResponseHeadersPolicy from '../resources/cloudfront-response-headers-policy.js';
import cloudwatchDelivery from '../resources/cloudwatch-delivery.js';
import cloudwatchDeliveryDestination from '../resources/cloudwatch-delivery-destination.js';
import cloudwatchDeliverySource from '../resources/cloudwatch-delivery-source.js';
import cloudwatchLogGroup from '../resources/cloudwatch-log-group.js';
import route53Records from '../resources/route53-records.js';
import s3Bucket from '../resources/s3-bucket.js';
import s3BucketObjects from '../resources/s3-bucket-objects.js';
import s3BucketPolicy from '../resources/s3-bucket-policy.js';
import { type ResolvedConfig } from '../types/config.js';
import { lock } from '../utils/lock.js';

export default async function up({ app, aws, domains, cdn }: ResolvedConfig): Promise<void> {
  const { region, profile } = aws;
  const { source, caching, types } = cdn;
  const ctx = new Context({ app, region, profile });
  const domain = await lock(ctx, async () => {
    await s3Bucket.up(ctx);
    await s3BucketObjects.up(ctx, { source, caching, types });

    const { originAccessControlId } = await cloudfrontOriginAccessControl.up(ctx);
    const { responseHeadersPolicyId } = await cloudfrontResponseHeadersPolicy.up(ctx);
    const { distributionId, distributionDomainName } = await cloudfrontDistribution.up(ctx, {
      domains,
      originAccessControlId,
      responseHeadersPolicyId,
    });

    await s3BucketPolicy.up(ctx, { distributionId });
    await cloudwatchLogGroup.up(ctx);
    await cloudwatchDeliverySource.up(ctx, { distributionId });
    await cloudwatchDeliveryDestination.up(ctx);
    await cloudwatchDelivery.up(ctx);
    await route53Records.up(ctx, { domains, distributionDomainName });
    await cloudfrontInvalidation.up(ctx, { distributionId });

    return distributionDomainName;
  });

  console.log(`\nApp deployed at: https://${domain}\n`);
}
