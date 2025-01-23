import {
  CloudFrontClient,
  CreateResponseHeadersPolicyCommand,
  DeleteResponseHeadersPolicyCommand,
  GetResponseHeadersPolicyConfigCommand,
  NoSuchResponseHeadersPolicy,
  type ResponseHeadersPolicyCustomHeader,
  UpdateResponseHeadersPolicyCommand,
} from '@aws-sdk/client-cloudfront';

import { createClientFactory, itemsWithQuantity } from '../client.js';
import { silence } from '../utils/silence.js';

export const createCdnPolicyClient = createClientFactory(({ credentials }) => {
  const client = new CloudFrontClient({ region: 'us-east-1', credentials });

  return {
    async createResponseHeadersPolicy(name: string, headers: Record<string, string>) {
      const items: ResponseHeadersPolicyCustomHeader[] = Object.entries(headers).map(([name, value]) => ({
        Header: name,
        Value: value,
        Override: false,
      }));

      if (!items.some((item) => item.Header?.toLowerCase() === 'cache-control')) {
        items.unshift({
          Header: 'Cache-Control',
          Value: 'max-age=0',
          Override: false,
        });
      }

      const { ResponseHeadersPolicy } = await client.send(new CreateResponseHeadersPolicyCommand({
        ResponseHeadersPolicyConfig: {
          Name: name,
          SecurityHeadersConfig: {
            StrictTransportSecurity: {
              Override: false,
              AccessControlMaxAgeSec: 31536000,
            },
            ContentTypeOptions: {
              Override: true,
            },
            FrameOptions: {
              Override: false,
              FrameOption: 'SAMEORIGIN',
            },
            XSSProtection: {
              Override: false,
              Protection: true,
              ModeBlock: true,
            },
            ReferrerPolicy: {
              Override: false,
              ReferrerPolicy: 'strict-origin-when-cross-origin',
            },
          },
          CustomHeadersConfig: itemsWithQuantity(items),
        },
      }));

      return ResponseHeadersPolicy!.Id!;
    },

    async updateResponseHeadersPolicy(id: string, headers: Readonly<Record<string, string>>) {
      const result = await silence([NoSuchResponseHeadersPolicy], async () => {
        const result = await client.send(new GetResponseHeadersPolicyConfigCommand({ Id: id }));
        const ResponseHeadersPolicyConfig = result.ResponseHeadersPolicyConfig!;
        const CustomHeadersConfig = ResponseHeadersPolicyConfig.CustomHeadersConfig;
        const SecurityHeadersConfig = ResponseHeadersPolicyConfig.SecurityHeadersConfig;
        const ContentSecurityPolicy = SecurityHeadersConfig?.ContentSecurityPolicy;
        const newEntries = Object.entries(headers)
          .map(([name, value]) => ({
            Header: name,
            Value: value,
            Override: false,
          }));
        const oldEntries = CustomHeadersConfig
          ?.Items
          ?.filter((item) => {
            return newEntries.some(({ Header }) => {
              return item.Header?.toLowerCase() === Header.toLowerCase();
            });
          });
        const entries = [...oldEntries ?? [], ...newEntries];

        return await client.send(new UpdateResponseHeadersPolicyCommand({
          Id: id,
          ResponseHeadersPolicyConfig: {
            ...ResponseHeadersPolicyConfig,
            SecurityHeadersConfig: {
              ...SecurityHeadersConfig,
              // XXX: Workaround for missing invalid GET command response.
              ContentSecurityPolicy: ContentSecurityPolicy?.ContentSecurityPolicy
                ? {
                    ...ContentSecurityPolicy,
                    Override: ContentSecurityPolicy.Override ?? false,
                  }
                : undefined,
            },
            CustomHeadersConfig: {
              Quantity: entries.length,
              Items: entries,
            },
          },
          IfMatch: result.ETag,
        }));
      });

      return Boolean(result);
    },

    async deleteResponseHeadersPolicy(id: string) {
      const result = await silence([NoSuchResponseHeadersPolicy], async () => {
        const result = await client.send(new GetResponseHeadersPolicyConfigCommand({ Id: id }));
        return await client.send(new DeleteResponseHeadersPolicyCommand({ Id: id, IfMatch: result.ETag }));
      });

      return Boolean(result);
    },
  };
});
