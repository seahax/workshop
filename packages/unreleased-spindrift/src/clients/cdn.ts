import { randomUUID } from 'node:crypto';

import {
  CloudFrontClient,
  CreateDistributionCommand,
  DeleteDistributionCommand,
  type DistributionConfig,
  GetDistributionConfigCommand,
  NoSuchDistribution,
  UpdateDistributionCommand,
  waitUntilDistributionDeployed,
} from '@aws-sdk/client-cloudfront';

import { createClientFactory } from '../client.js';
import { silence } from '../utils/silence.js';

export type CdnConfig = Omit<
  DistributionConfig,
  | 'CallerReference'
  | 'Enabled'
  | 'Comment'
  | 'PriceClass'
  | 'HttpVersion'
>;

export const createCdnClient = createClientFactory((credentials) => {
  const client = new CloudFrontClient({ region: 'us-east-1', credentials });

  return {
    async create(params: CdnConfig) {
      const { Distribution } = await client.send(new CreateDistributionCommand({
        DistributionConfig: {
          ...params,
          CallerReference: randomUUID(),
          Enabled: true,
          Comment: 'Created by Spindrift.',
          PriceClass: 'PriceClass_All',
          HttpVersion: 'http2and3',
        },
      }));

      const id = Distribution!.Id!;
      const domain = Distribution!.DomainName!;

      return { id, domain };
    },

    async update(id: string, { DefaultCacheBehavior, ...params }: CdnConfig) {
      const result = await silence([NoSuchDistribution], async () => {
        const { ETag, DistributionConfig } = await client.send(new GetDistributionConfigCommand({ Id: id }));

        return await client.send(new UpdateDistributionCommand({
          Id: id,
          DistributionConfig: {
            ...DistributionConfig!,
            ...params,
            DefaultCacheBehavior: {
              // XXX: Workaround for missing property in the GET command.
              SmoothStreaming: undefined,
              // XXX: Workaround for missing property in the GET command.
              FieldLevelEncryptionId: undefined,
              // XXX: Workaround for missing property in the GET command.
              LambdaFunctionAssociations: undefined,
              ...DistributionConfig!.DefaultCacheBehavior!,
              ...DefaultCacheBehavior,
            },
          },
          IfMatch: ETag,
        }));
      });

      return Boolean(result);
    },

    async disable(id: string) {
      const result = await silence([NoSuchDistribution], async () => {
        const { ETag, DistributionConfig } = await client.send(new GetDistributionConfigCommand({ Id: id }));

        return await client.send(new UpdateDistributionCommand({
          Id: id,
          IfMatch: ETag,
          DistributionConfig: {
            ...DistributionConfig!,
            Enabled: false,
          },
        }));
      });

      return Boolean(result);
    },

    async waitForDeployment(id: string) {
      await waitUntilDistributionDeployed({ client, maxWaitTime: 900, maxDelay: 30, minDelay: 5 }, { Id: id });
    },

    async delete(id: string) {
      const result = await silence([NoSuchDistribution], async () => {
        const { ETag } = await client.send(new GetDistributionConfigCommand({ Id: id }));
        return await client.send(new DeleteDistributionCommand({ Id: id, IfMatch: ETag }));
      });

      return Boolean(result);
    },
  };
});
