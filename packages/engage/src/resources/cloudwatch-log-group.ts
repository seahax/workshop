import {
  CloudWatchLogsClient,
  CreateLogGroupCommand,
  DeleteLogGroupCommand,
  DescribeLogGroupsCommand,
  ListTagsForResourceCommand,
  PutRetentionPolicyCommand,
} from '@aws-sdk/client-cloudwatch-logs';

import { TAG_NAME } from '../constants/tags.js';
import { createResource } from '../resource.js';
import { collect } from '../utils/collect.js';
import { id } from '../utils/id.js';
import { map } from '../utils/map.js';
import { paginated } from '../utils/paginated.js';

export default createResource('CloudWatch Log Group', {
  async up({ app, createClient, cleanup }) {
    const client = createClient(CloudWatchLogsClient, { region: 'us-east-1' });
    const names = await findNames(client, app);
    let name = names.shift();

    if (!name) {
      name = `engage-${id()}`;

      await client.send(new CreateLogGroupCommand({
        logGroupName: name,
        logGroupClass: 'STANDARD',
        tags: { [TAG_NAME]: app },
      }));
    }

    await client.send(new PutRetentionPolicyCommand({
      logGroupName: name,
      retentionInDays: 365,
    }));

    cleanup(async () => await deleteAll(client, names));

    return { cloudWatchLogGroupName: name };
  },

  async down({ app, createClient }) {
    const client = createClient(CloudWatchLogsClient, { region: 'us-east-1' });
    const names = await findNames(client, app);
    await deleteAll(client, names);
  },

  async get({ app, createClient }) {
    const client = createClient(CloudWatchLogsClient, { region: 'us-east-1' });
    const names = await findNames(client, app);
    return { cloudWatchLogGroupName: names[0] ?? null };
  },
});

async function findNames(client: CloudWatchLogsClient, appName: string): Promise<string[]> {
  return await collect(map(
    paginated(async (nextToken) => {
      const result = await client.send(new DescribeLogGroupsCommand({ logGroupNamePrefix: 'engage-', nextToken }));
      return { values: result.logGroups, next: result.nextToken };
    }),
    async ({ arn, logGroupName }) => {
      const { tags } = await client.send(new ListTagsForResourceCommand({ resourceArn: arn?.replace(/:\*$/u, '') }));
      return tags?.[TAG_NAME] === appName ? logGroupName : undefined;
    },
  ));
}

async function deleteAll(client: CloudWatchLogsClient, names: string[]): Promise<void> {
  await collect(map(names, async (name) => {
    await client.send(new DeleteLogGroupCommand({ logGroupName: name }));
  }));
}
