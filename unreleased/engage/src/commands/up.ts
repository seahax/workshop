import { getAccountId } from '../account.js';
import { createClients } from '../clients.js';
import { createComponents } from '../components.js';
import { createContext } from '../context.js';
import { getCredentials } from '../credentials.js';
import cloudfrontDistributionResource from '../resources/cloudfront-distribution.js';
import cloudfrontInvalidationResource from '../resources/cloudfront-invalidation.js';
import cloudfrontOriginAccessControlResource from '../resources/cloudfront-origin-access-control.js';
import cloudfrontResponseHeadersPolicyResource from '../resources/cloudfront-response-headers-policy.js';
import cloudwatchDeliveryResource from '../resources/cloudwatch-delivery.js';
import cloudwatchDeliveryDestinationResource from '../resources/cloudwatch-delivery-destination.js';
import cloudwatchDeliverySourceResource from '../resources/cloudwatch-delivery-source.js';
import cloudwatchLogGroupResource from '../resources/cloudwatch-log-group.js';
import route53RecordsResource from '../resources/route53-records.js';
import s3BucketResource from '../resources/s3-bucket.js';
import s3BucketObjectsResource from '../resources/s3-bucket-objects.js';
import s3BucketPolicyResource from '../resources/s3-bucket-policy.js';
import { type ResolvedConfig } from '../types/config.js';
import { lock } from '../utils/lock.js';

export default async function up({ app, aws, domains, cdn }: ResolvedConfig): Promise<void> {
  const { region, profile } = aws;
  const { source, logging, responses, caching, types } = cdn;
  const credentials = getCredentials({ profile });
  const results = await lock({ app, credentials }, async () => {
    const components = createComponents({ app, credentials });
    const clients = createClients({ region, credentials });
    const [appId, accountId] = await Promise.all([
      components.requireId('app'),
      getAccountId({ credentials }),
    ]);
    const [ctx, ctxCleanup] = createContext({ appId, accountId, region, components, clients });

    // Resources
    {
      const { s3BucketName } = await s3BucketResource.up(ctx);

      await s3BucketObjectsResource.up(ctx, { s3BucketName, source, caching, types });

      const { cloudFrontOriginAccessControlId } = await cloudfrontOriginAccessControlResource.up(ctx, { s3BucketName });
      const { cloudFrontResponseHeadersPolicyId } = await cloudfrontResponseHeadersPolicyResource.up(ctx, {
        s3BucketName,
      });
      const {
        cloudFrontDistributionId,
        cloudFrontDistributionDomainName,
      } = await cloudfrontDistributionResource.up(ctx, {
        domains,
        responses,
        originAccessControlId: cloudFrontOriginAccessControlId,
        responseHeadersPolicyId: cloudFrontResponseHeadersPolicyId,
      });

      await s3BucketPolicyResource.up(ctx, { s3BucketName, cloudFrontDistributionId });

      const { cloudWatchLogGroupName } = await cloudwatchLogGroupResource.up(ctx);
      const { cloudWatchDeliverySourceName } = await cloudwatchDeliverySourceResource.up(ctx, {
        enabled: logging !== 'none',
        cloudFrontDistributionId,
      });
      const { cloudWatchDeliveryDestinationName } = await cloudwatchDeliveryDestinationResource.up(ctx, {
        enabled: logging !== 'none',
        cloudWatchLogGroupName,
      });
      const { cloudWatchDeliveryId } = await cloudwatchDeliveryResource.up(ctx, {
        logging,
        cloudWatchDeliverySourceName,
        cloudWatchDeliveryDestinationName,
      });

      await route53RecordsResource.up(ctx, { domains, cloudFrontDistributionDomainName });
      await cloudfrontInvalidationResource.up(ctx, { distributionId: cloudFrontDistributionId });
      await ctxCleanup();

      return {
        s3BucketName,
        cloudFrontOriginAccessControlId,
        cloudFrontResponseHeadersPolicyId,
        cloudFrontDistributionId,
        cloudFrontDistributionDomainName,
        cloudWatchLogGroupName,
        cloudWatchDeliverySourceName,
        cloudWatchDeliveryDestinationName,
        cloudWatchDeliveryId,
      };
    }
  });

  console.log(JSON.stringify(results, null, 2));
}
