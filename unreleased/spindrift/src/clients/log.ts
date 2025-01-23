import {
  CloudWatchLogsClient,
  CreateLogGroupCommand,
  ResourceAlreadyExistsException,
} from '@aws-sdk/client-cloudwatch-logs';

import { createClientFactory } from '../client.js';
import { silence } from '../utils/silence.js';

export const createLogClient = createClientFactory(async ({ credentials }) => {
  const client = new CloudWatchLogsClient({ region: 'us-east-1', credentials });

  return {
    async createLogGroup(name: string): Promise<void> {
      await silence([ResourceAlreadyExistsException], client.send(new CreateLogGroupCommand({ logGroupName: name })));
    },
  };
});
