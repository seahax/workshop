import {
  CloudWatchLogsClient,
  DeleteDeliverySourceCommand,
  type DeliverySource,
  DescribeDeliverySourcesCommand,
  PutDeliverySourceCommand,
} from '@aws-sdk/client-cloudwatch-logs';

import { TAG_NAME } from '../constants/tags.js';
import { createResource } from '../resource.js';
import { collect } from '../utils/collect.js';
import { id } from '../utils/id.js';
import { map } from '../utils/map.js';
import { paginated } from '../utils/paginated.js';

interface Params {
  readonly enabled: boolean;
  readonly cloudFrontDistributionId: string;
}

export default createResource('CloudWatch Delivery Source', {
  async up({ app, createClient, getIdentity, cleanup }, { enabled, cloudFrontDistributionId }: Params) {
    const client = createClient(CloudWatchLogsClient, { region: 'us-east-1' });
    const { Account } = await getIdentity();
    const resourceArn = `arn:aws:cloudfront::${Account}:distribution/${cloudFrontDistributionId}`;
    const sources = await getSources(client);
    const source = [...sources.values()].find((source) => source.resourceArns?.includes(resourceArn));
    let name = source?.name;

    if (name != null) {
      sources.delete(name);
    }
    else if (enabled) {
      name = `engage-${id()}`;

      await client.send(new PutDeliverySourceCommand({
        name,
        logType: 'ACCESS_LOGS',
        resourceArn,
        tags: { [TAG_NAME]: app },
      }));
    }

    cleanup(async () => await deleteAll(client, app, sources.values()));

    return { cloudWatchDeliverySourceName: name ?? null };
  },

  async down({ app, createClient }) {
    const client = createClient(CloudWatchLogsClient, { region: 'us-east-1' });
    const sources = await getSources(client);
    await deleteAll(client, app, sources.values());
  },

  async get({ app, createClient }) {
    const client = createClient(CloudWatchLogsClient, { region: 'us-east-1' });
    const sources = await getSources(client);
    const source = [...sources.values()].find((source) => source.tags?.[TAG_NAME] === app);

    return { cloudWatchDeliverySourceName: source?.name ?? null };
  },
});

async function getSources(client: CloudWatchLogsClient): Promise<Map<string, DeliverySource>> {
  const entries = await collect(map(
    paginated(async (nextToken) => {
      const result = await client.send(new DescribeDeliverySourcesCommand({ nextToken }));
      return { values: result.deliverySources, next: result.nextToken };
    }),
    async (source) => [[source.name!, source]] as const,
  ));

  return new Map(entries);
}

async function deleteAll(client: CloudWatchLogsClient, app: string, sources: Iterable<DeliverySource>): Promise<void> {
  await collect(map(sources, async (source) => {
    if (source.tags?.[TAG_NAME] === app) {
      await client.send(new DeleteDeliverySourceCommand({ name: source.name! }));
    }
  }));
}
