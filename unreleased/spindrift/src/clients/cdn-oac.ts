import {
  CloudFrontClient,
  CreateOriginAccessControlCommand,
  DeleteOriginAccessControlCommand,
  GetOriginAccessControlConfigCommand,
  NoSuchOriginAccessControl,
  type OriginAccessControlConfig,
  UpdateOriginAccessControlCommand,
} from '@aws-sdk/client-cloudfront';

import { createClientFactory } from '../client.js';
import { silence } from '../utils/silence.js';

export const createCdnOacClient = createClientFactory((credentials) => {
  const client = new CloudFrontClient({ region: 'us-east-1', credentials });

  return {
    async createOac(config: OriginAccessControlConfig) {
      const result = await client.send(new CreateOriginAccessControlCommand({
        OriginAccessControlConfig: config,
      }));

      return result.OriginAccessControl!.Id!;
    },

    async updateOac(id: string, config: OriginAccessControlConfig) {
      const result = await silence([NoSuchOriginAccessControl], async () => {
        const result = await client.send(new GetOriginAccessControlConfigCommand({ Id: id }));

        return await client.send(new UpdateOriginAccessControlCommand({
          Id: id,
          OriginAccessControlConfig: config,
          IfMatch: result.ETag,
        }));
      });

      return Boolean(result);
    },

    async deleteOac(id: string) {
      const result = await silence([NoSuchOriginAccessControl], async () => {
        const result = await client.send(new GetOriginAccessControlConfigCommand({ Id: id }));
        return await client.send(new DeleteOriginAccessControlCommand({ Id: id, IfMatch: result.ETag }));
      });

      return Boolean(result);
    },
  };
});
