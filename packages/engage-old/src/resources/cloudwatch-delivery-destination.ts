import {
  CloudWatchLogsClient,
  DeleteDeliveryDestinationCommand,
  DescribeDeliveryDestinationsCommand,
  PutDeliveryDestinationCommand,
  TagResourceCommand,
} from '@aws-sdk/client-cloudwatch-logs';

import { TAG_NAME } from '../constants/tags.js';
import { createResource } from '../resource.js';
import { collect } from '../utils/collect.js';
import { id } from '../utils/id.js';
import { map } from '../utils/map.js';
import { paginated } from '../utils/paginated.js';

interface Params {
  enabled: boolean;
  cloudWatchLogGroupName: string;
}

export default createResource('CloudWatch Delivery Destination', {
  async up({ app, createClient, getIdentity, cleanup }, { enabled, cloudWatchLogGroupName }: Params) {
    const client = createClient(CloudWatchLogsClient, { region: 'us-east-1' });
    const names = await findNames(client, app);
    console.log(names);
    let name: string | undefined;

    if (enabled) {
      name = names.shift();

      if (!name) {
        const { Account } = await getIdentity();

        name = `engage-${id()}`;

        const result = await client.send(new PutDeliveryDestinationCommand({
          name,
          outputFormat: 'json',
          deliveryDestinationConfiguration: {
            destinationResourceArn: `arn:aws:logs:us-east-1:${Account}:log-group:${cloudWatchLogGroupName}:*`,
          },
        }));

        await client.send(new TagResourceCommand({
          resourceArn: result.deliveryDestination?.arn,
          tags: { foo: 'bar' },
        }));
      }
    }

    cleanup(async () => await deleteAll(client, names));

    return { cloudWatchDeliveryDestinationName: name ?? null };
  },

  async down({ app, createClient }) {
    const client = createClient(CloudWatchLogsClient, { region: 'us-east-1' });
    const names = await findNames(client, app);
    await deleteAll(client, names);
  },

  async get({ app, createClient }) {
    const client = createClient(CloudWatchLogsClient, { region: 'us-east-1' });
    const names = await findNames(client, app);
    return { cloudWatchDeliveryDestinationName: names[0] ?? null };
  },
});

async function findNames(client: CloudWatchLogsClient, app: string): Promise<string[]> {
  return await collect(map(
    paginated(async (nextToken) => {
      const result = await client.send(new DescribeDeliveryDestinationsCommand({ nextToken }));
      return { values: result.deliveryDestinations, next: result.nextToken };
    }),
    async ({ name, tags }) => {
      return tags?.[TAG_NAME] === app ? name : undefined;
    },
  ));
}

async function deleteAll(client: CloudWatchLogsClient, names: string[]): Promise<void> {
  await Promise.all(names.map(async (name) => {
    await client.send(new DeleteDeliveryDestinationCommand({ name }));
  }));
}
