import {
  CloudWatchLogsClient,
  DeleteDeliverySourceCommand,
  PutDeliverySourceCommand,
} from '@aws-sdk/client-cloudwatch-logs';

import { TAG_NAME } from '../constants/tags.js';
import { createResource } from '../resource.js';
import { silence } from '../utils/silence.js';

interface Params {
  readonly distributionId: string;
}

export default createResource('CloudWatch Delivery Source', {
  async up({ app, createClient, getAccountId }, { distributionId }: Params) {
    const client = createClient(CloudWatchLogsClient, { region: 'us-east-1' });
    const accountId = await getAccountId();

    await silence(['ConflictException'], client.send(new PutDeliverySourceCommand({
      name: `e4e-${app}`,
      logType: 'ACCESS_LOGS',
      resourceArn: `arn:aws:cloudfront::${accountId}:distribution/${distributionId}`,
      tags: { [TAG_NAME]: app },
    })));
  },

  async down({ app, createClient }) {
    const client = createClient(CloudWatchLogsClient, { region: 'us-east-1' });

    await silence(['ResourceNotFoundException'], client.send(new DeleteDeliverySourceCommand({
      name: `e4e-${app}`,
    })));
  },
});
