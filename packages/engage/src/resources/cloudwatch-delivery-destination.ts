import {
  CloudWatchLogsClient,
  DeleteDeliveryDestinationCommand,
  PutDeliveryDestinationCommand,
} from '@aws-sdk/client-cloudwatch-logs';

import { TAG_NAME } from '../constants/tags.js';
import { createResource } from '../resource.js';
import { silence } from '../utils/silence.js';

export default createResource('CloudWatch Delivery Destination', {
  async up({ app, createClient, getAccountId }) {
    const client = createClient(CloudWatchLogsClient, { region: 'us-east-1' });
    const accountId = await getAccountId();

    await silence(['ConflictException'], client.send(new PutDeliveryDestinationCommand({
      name: `e4e-${app}`,
      outputFormat: 'json',
      deliveryDestinationConfiguration: {
        destinationResourceArn: `arn:aws:logs:us-east-1:${accountId}:log-group:e4e-${app}:*`,
      },
      tags: { [TAG_NAME]: app },
    })));
  },

  async down({ app, createClient }) {
    const client = createClient(CloudWatchLogsClient, { region: 'us-east-1' });

    await silence(['ResourceNotFoundException'], client.send(new DeleteDeliveryDestinationCommand({
      name: `e4e-${app}`,
    })));
  },
});
