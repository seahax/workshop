import {
  CloudWatchLogsClient,
  CreateDeliveryCommand,
  DeleteDeliveryCommand,
  DescribeDeliveriesCommand,
  UpdateDeliveryConfigurationCommand,
} from '@aws-sdk/client-cloudwatch-logs';

import { TAG_NAME } from '../constants/tags.js';
import { createResource } from '../resource.js';
import { collect } from '../utils/collect.js';
import { map } from '../utils/map.js';
import { paginated } from '../utils/paginated.js';
import { silence } from '../utils/silence.js';

interface Params {
  readonly cloudWatchDeliverySourceName: string | null;
  readonly cloudWatchDeliveryDestinationName: string | null;
  readonly logging: 'none' | 'basic' | 'debug';
}

interface Delivery {
  readonly deliverySourceName: string;
  readonly deliveryDestinationArn: string;
}

const CLOUD_WATCH_RECORD_FIELDS = {
  // Timing
  'timestamp(ms)': true,
  timestamp: false,
  date: false,
  time: false,
  'time-taken': true,
  'time-to-first-byte': false,
  'origin-fbl': true, // First byte latency from origin
  'origin-lbl': false, // Last byte latency from origin
  // Client
  'c-ip': false,
  'c-port': false,
  // Client -> Server
  'cs-protocol': true,
  'cs-protocol-version': false,
  'cs-method': true,
  'cs-uri-stem': true,
  'cs-uri-query': true,
  'cs-bytes': true,
  'cs(Host)': false,
  'cs(Referer)': true,
  'cs(User-Agent)': false,
  'cs(Cookie)': false,
  // Server -> Client
  'sc-status': true,
  'sc-bytes': false,
  'sc-content-type': false,
  'sc-content-len': false,
  'sc-range-start': false,
  'sc-range-end': false,
  'ssl-protocol': false,
  'ssl-cipher': false,
  // Other
  DistributionId: false,
  'x-host-header': true,
  'x-forwarded-for': false,
  'x-edge-location': false,
  'x-edge-result-type': true,
  'x-edge-detailed-result-type': true,
  'x-edge-response-result-type': true,
  'x-edge-request-id': true,
  'fle-status': false,
  'fle-encrypted-fields': false,
  asn: false,
} as const;

export default createResource('CloudWatch Delivery', {
  async up(
    { app, createClient, getIdentity, cleanup },
    { cloudWatchDeliverySourceName, cloudWatchDeliveryDestinationName, logging }: Params,
  ): Promise<{ cloudWatchDeliveryId: string | null }> {
    const client = createClient(CloudWatchLogsClient, { region: 'us-east-1' });
    const deliveries = await findDeliveries(client, app);
    let id: string | undefined;

    if (logging !== 'none' && cloudWatchDeliveryDestinationName != null && cloudWatchDeliverySourceName != null) {
      const { Account } = await getIdentity();
      const cloudWatchDeliveryDestinationArn = `arn:aws:logs:us-east-1:${Account}:delivery-destination:${cloudWatchDeliveryDestinationName}`;
      const recordFields = Object.entries(CLOUD_WATCH_RECORD_FIELDS).flatMap(([name, enabled]) => {
        if (logging === 'basic' && !enabled) return [];
        return [name];
      });

      id = getDeliveryId(deliveries, cloudWatchDeliverySourceName, cloudWatchDeliveryDestinationArn);

      if (id) {
        deliveries.delete(id);
        await client.send(new UpdateDeliveryConfigurationCommand({ id, recordFields }));
      }
      else {
        console.log(cloudWatchDeliveryDestinationName);
        console.log(cloudWatchDeliveryDestinationArn);
        const result = await silence(['ConflictException'], client.send(new CreateDeliveryCommand({
          deliverySourceName: cloudWatchDeliverySourceName,
          deliveryDestinationArn: cloudWatchDeliveryDestinationArn,
          recordFields,
          tags: { [TAG_NAME]: app },
        })));

        id = result?.delivery?.id;
      }
    }

    cleanup(async () => await deleteAll(client, [...deliveries.keys()]));

    return { cloudWatchDeliveryId: id ?? null };
  },

  async down({ app, createClient }) {
    const client = createClient(CloudWatchLogsClient, { region: 'us-east-1' });
    const deliveries = await findDeliveries(client, app);
    await deleteAll(client, [...deliveries.keys()]);
  },

  async get({ app, createClient }) {
    const client = createClient(CloudWatchLogsClient, { region: 'us-east-1' });
    const deliveries = await findDeliveries(client, app);
    const id = deliveries.keys().next().value;

    return { cloudWatchDeliveryId: id ?? null };
  },
});

async function findDeliveries(
  client: CloudWatchLogsClient,
  app: string,
): Promise<Map<string, Delivery>> {
  const entries = await collect(map(
    paginated(async (nextToken) => {
      const result = await client.send(new DescribeDeliveriesCommand({ nextToken }));
      return { values: result.deliveries, next: result.nextToken };
    }),
    async (delivery) => {
      return delivery.tags?.[TAG_NAME] === app
        ? [[delivery.id!, {
            id: delivery.id!,
            deliverySourceName: delivery.deliverySourceName!,
            deliveryDestinationArn: delivery.deliveryDestinationArn!,
          }]] as const
        : undefined;
    },
  ));

  return new Map(entries);
}

function getDeliveryId(
  deliveries: Map<string, Delivery>,
  cloudWatchDeliverySourceName: string,
  cloudWatchDeliveryDestinationArn: string,
): string | undefined {
  for (const delivery of deliveries) {
    if (
      delivery[1].deliverySourceName === cloudWatchDeliverySourceName
      && delivery[1].deliveryDestinationArn === cloudWatchDeliveryDestinationArn
    ) {
      return delivery[0];
    }
  }
}

async function deleteAll(client: CloudWatchLogsClient, ids: string[]): Promise<void> {
  await collect(map(ids, async (id) => {
    await client.send(new DeleteDeliveryCommand({ id }));
  }));
}
