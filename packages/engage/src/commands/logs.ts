import { CloudWatchLogsClient, StartLiveTailCommand } from '@aws-sdk/client-cloudwatch-logs';
import { type AwsCredentialIdentityProvider } from '@smithy/types';

import { getAccountId } from '../account.js';
import { type Clients, createClients } from '../clients.js';
import { createComponents } from '../components.js';
import { createContext } from '../context.js';
import { getCredentials } from '../credentials.js';
import cloudfrontDistribution from '../resources/cloudfront-distribution.js';
import { type ResolvedConfig } from '../types/config.js';
import { assert } from '../utils/assert.js';

export default async function logs({ app, aws }: ResolvedConfig): Promise<void> {
  const { region, profile } = aws;
  const credentials = getCredentials({ profile });
  const accountId = await getAccountId({ credentials });
  const clients = createClients({ region, credentials });
  const distributionId = await getDistributionId(app, accountId, region, clients, credentials);

  assert(distributionId, `CloudFront distribution missing.`);

  const client = clients.create(CloudWatchLogsClient, { region: 'us-east-1' });
  const { responseStream } = await client.send(new StartLiveTailCommand({
    logGroupIdentifiers: [
      `arn:aws:logs:us-east-1:${accountId}:log-group:e4e-${app}`,
    ],
    logStreamNames: [
      `CloudFront_${distributionId}`,
    ],
  }));

  assert(responseStream, `CloudWatch Logs response stream missing.`);

  for await (const event of responseStream) {
    if (event.sessionStart) {
      console.log('CloudWatch live tail session started.');
    }

    if (event.sessionUpdate?.sessionResults) {
      for (const logEvent of event.sessionUpdate.sessionResults) {
        console.log(`[${new Date(logEvent.timestamp!).toLocaleString()}] ${logEvent.message}`);
      }
    }
  }
}

async function getDistributionId(
  app: string,
  accountId: string,
  region: string,
  clients: Clients,
  credentials: AwsCredentialIdentityProvider,
): Promise<string | null> {
  const components = createComponents({ app, credentials });
  const appId = await components.getId('app');

  if (appId == null) return null;

  const [ctx, ctxCleanup] = createContext({ appId, accountId, region, clients, components });
  const { cloudFrontDistributionId: distributionId } = await cloudfrontDistribution.get(ctx);

  await ctxCleanup();

  return distributionId;
}
