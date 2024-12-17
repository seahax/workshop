import {
  CloudFrontClient,
  CreateResponseHeadersPolicyCommand,
  DeleteResponseHeadersPolicyCommand,
  GetResponseHeadersPolicyConfigCommand,
  ListResponseHeadersPoliciesCommand,
  type ResponseHeadersPolicyConfig,
  UpdateResponseHeadersPolicyCommand,
} from '@aws-sdk/client-cloudfront';

import { createResource } from '../resource.js';
import { assert } from '../utils/assert.js';
import { paginated } from '../utils/paginated.js';

export default createResource('CloudFront Response Headers Policy', {
  async up({ app, createClient }) {
    const client = createClient(CloudFrontClient);
    let id = await findId(client, app);

    if (id) {
      const { ETag } = await client.send(new GetResponseHeadersPolicyConfigCommand({
        Id: id,
      }));
      await client.send(new UpdateResponseHeadersPolicyCommand({
        Id: id,
        ResponseHeadersPolicyConfig: getResponseHeadersConfig(app),
        IfMatch: ETag,
      }));
    }
    else {
      const { ResponseHeadersPolicy } = await client.send(new CreateResponseHeadersPolicyCommand({
        ResponseHeadersPolicyConfig: getResponseHeadersConfig(app),
      }));

      assert(ResponseHeadersPolicy?.Id, `CloudFront response headers policy ID missing.`);
      id = ResponseHeadersPolicy.Id;
    }

    return { responseHeadersPolicyId: id };
  },

  async down({ app, createClient }) {
    const client = createClient(CloudFrontClient);
    const id = await findId(client, app);

    if (id) {
      const { ETag } = await client.send(new GetResponseHeadersPolicyConfigCommand({ Id: id }));
      await client.send(new DeleteResponseHeadersPolicyCommand({ Id: id, IfMatch: ETag }));
    }
  },
});

async function findId(client: CloudFrontClient, app: string): Promise<string | undefined> {
  const policies = paginated(async (Marker) => {
    const result = await client.send(new ListResponseHeadersPoliciesCommand({ Marker, Type: 'custom' }));
    return { values: result.ResponseHeadersPolicyList?.Items, next: result.ResponseHeadersPolicyList?.NextMarker };
  });

  for await (const policy of policies) {
    if (policy.ResponseHeadersPolicy?.ResponseHeadersPolicyConfig?.Name === `e4e-${app}`) {
      return policy.ResponseHeadersPolicy.Id;
    }
  }
}

function getResponseHeadersConfig(app: string): ResponseHeadersPolicyConfig {
  return {
    Name: `e4e-${app}`,
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
    CustomHeadersConfig: {
      Quantity: 1,
      Items: [
        {
          Header: 'Cache-Control',
          Value: 'max-age=0',
          Override: false,
        },
      ],
    },
  };
}
