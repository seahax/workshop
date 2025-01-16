import { getAccountId } from '../account.js';
import { createClients } from '../clients.js';
import { createComponents } from '../components.js';
import { createContext } from '../context.js';
import { getCredentials } from '../credentials.js';
import cloudfrontDistributionResource from '../resources/cloudfront-distribution.js';
import cloudfrontOriginAccessControlResource from '../resources/cloudfront-origin-access-control.js';
import cloudfrontResponseHeadersPolicyResource from '../resources/cloudfront-response-headers-policy.js';
import cloudwatchDeliveryResource from '../resources/cloudwatch-delivery.js';
import cloudwatchDeliveryDestinationResource from '../resources/cloudwatch-delivery-destination.js';
import cloudwatchDeliverySourceResource from '../resources/cloudwatch-delivery-source.js';
import cloudwatchLogGroupResource from '../resources/cloudwatch-log-group.js';
import s3BucketResource from '../resources/s3-bucket.js';
import { type ResolvedConfig } from '../types/config.js';
import { lock } from '../utils/lock.js';

export default async function down({ app, aws }: ResolvedConfig): Promise<void> {
  const { region, profile } = aws;
  const credentials = getCredentials({ profile });

  await lock({ app, credentials }, async () => {
    const components = createComponents({ app, credentials });
    const [appId, accountId] = await Promise.all([
      components.getId('app'),
      getAccountId({ credentials }),
    ]);

    if (appId == null) return;

    const clients = createClients({ region, credentials });
    const [ctx, ctxCleanup] = createContext({ appId, accountId, region, components, clients });

    // Resources
    {
      await cloudwatchDeliveryResource.down(ctx);
      await cloudwatchDeliveryDestinationResource.down(ctx);
      await cloudwatchDeliverySourceResource.down(ctx);
      await cloudwatchLogGroupResource.down(ctx);
      await cloudfrontDistributionResource.down(ctx);
      await cloudfrontResponseHeadersPolicyResource.down(ctx);
      await cloudfrontOriginAccessControlResource.down(ctx);
      await s3BucketResource.down(ctx);
      await ctxCleanup();
    }
  });
}
