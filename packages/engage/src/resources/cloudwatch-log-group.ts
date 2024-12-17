import {
  CloudWatchLogsClient,
  CreateLogGroupCommand,
  DeleteLogGroupCommand,
  PutRetentionPolicyCommand,
} from '@aws-sdk/client-cloudwatch-logs';

import { TAG_NAME } from '../constants/tags.js';
import { createResource } from '../resource.js';
import { silence } from '../utils/silence.js';

export default createResource('CloudWatch Log Group', {
  async up({ app, createClient }) {
    const client = createClient(CloudWatchLogsClient, { region: 'us-east-1' });

    await silence(['ResourceAlreadyExistsException'], client.send(new CreateLogGroupCommand({
      logGroupName: `e4e-${app}`,
      logGroupClass: 'STANDARD',
      tags: { [TAG_NAME]: app },
    })));

    await client.send(new PutRetentionPolicyCommand({
      logGroupName: `e4e-${app}`,
      retentionInDays: 365,
    }));
  },

  async down({ app, createClient }) {
    const client = createClient(CloudWatchLogsClient, { region: 'us-east-1' });

    await silence(['ResourceNotFoundException'], client.send(new DeleteLogGroupCommand({
      logGroupName: `e4e-${app}`,
    })));
  },
});
