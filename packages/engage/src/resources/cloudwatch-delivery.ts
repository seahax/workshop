import {
  CloudWatchLogsClient,
  CreateDeliveryCommand,
  DeleteDeliveryCommand,
  DescribeDeliveriesCommand,
  UpdateDeliveryConfigurationCommand,
} from '@aws-sdk/client-cloudwatch-logs';

import { TAG_NAME } from '../constants/tags.js';
import { createResource } from '../resource.js';
import { assert } from '../utils/assert.js';
import { paginated } from '../utils/paginated.js';

const CLOUD_WATCH_RECORD_FIELDS = [
  // 'timestamp',
  // 'DistributionId',
  // 'date',
  // 'time',
  'timestamp(ms)',
  // Client
  'c-ip',
  'c-port',
  // Client -> Server
  'cs-protocol',
  'cs-protocol-version',
  'cs-method',
  'cs-uri-stem',
  'cs-uri-query',
  'cs-bytes',
  'cs(Host)',
  'cs(Referer)',
  'cs(User-Agent)',
  // 'cs(Cookie)',
  // Server -> Client
  'sc-status',
  'sc-bytes',
  'sc-content-type',
  'sc-content-len',
  'sc-range-start',
  'sc-range-end',
  'ssl-protocol',
  'ssl-cipher',
  'x-host-header',
  'x-forwarded-for',
  'x-edge-location',
  'x-edge-result-type',
  'x-edge-request-id',
  'x-edge-response-result-type',
  'x-edge-detailed-result-type',
  'time-taken',
  'time-to-first-byte',
  'origin-fbl', // First byte latency from origin
  'origin-lbl', // Last byte latency from origin
  // 'fle-status',
  // 'fle-encrypted-fields',
  // 'asn',
] as const;

export default createResource('CloudWatch Delivery', {
  async up({ app, createClient, getAccountId }) {
    const client = createClient(CloudWatchLogsClient, { region: 'us-east-1' });
    const accountId = await getAccountId();
    let id = await findId(client, accountId, app);

    if (id) {
      await client.send(new UpdateDeliveryConfigurationCommand({
        id: id,
        recordFields: [...CLOUD_WATCH_RECORD_FIELDS],
      }));
    }
    else {
      const { delivery } = await client.send(new CreateDeliveryCommand({
        deliverySourceName: `e4e-${app}`,
        deliveryDestinationArn: `arn:aws:logs:us-east-1:${accountId}:delivery-destination:e4e-${app}`,
        recordFields: [...CLOUD_WATCH_RECORD_FIELDS],
        tags: { [TAG_NAME]: app },
      }));

      assert(delivery?.id, `CloudWatch delivery ID missing.`);
      id = delivery.id;
    }

    return { deliveryId: id };
  },

  async down({ app, createClient, getAccountId }) {
    const client = createClient(CloudWatchLogsClient, { region: 'us-east-1' });
    const accountId = await getAccountId();
    const id = await findId(client, accountId, app);

    if (id) {
      await client.send(new DeleteDeliveryCommand({ id: id }));
    }
  },
});

async function findId(client: CloudWatchLogsClient, accountId: string, app: string): Promise<string | undefined> {
  const deliveries = paginated(async (nextToken) => {
    const result = await client.send(new DescribeDeliveriesCommand({ nextToken }));
    return { values: result.deliveries, next: result.nextToken };
  });

  for await (const delivery of deliveries) {
    if (delivery.deliverySourceName !== `e4e-${app}`) continue;
    if (delivery.deliveryDestinationArn !== `arn:aws:logs:us-east-1:${accountId}:delivery-destination:e4e-${app}`) continue;
    return delivery.id;
  };
}
