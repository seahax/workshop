import { CloudWatchLogsClient, StartLiveTailCommand } from '@aws-sdk/client-cloudwatch-logs';

import { Context } from '../context.js';
import cloudfrontDistribution from '../resources/cloudfront-distribution.js';
import { type ResolvedConfig } from '../types/config.js';
import { assert } from '../utils/assert.js';

export default async function logs({ app, aws }: ResolvedConfig): Promise<void> {
  const { region, profile } = aws;
  const ctx = new Context({ app, region, profile });
  const { createClient, getAccountId } = ctx;
  const client = createClient(CloudWatchLogsClient, { region: 'us-east-1' });
  const accountId = await getAccountId();
  const { distributionId } = await cloudfrontDistribution.get(ctx);
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
