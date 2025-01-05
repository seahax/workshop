import {
  CloudFrontClient,
  CreateResponseHeadersPolicyCommand,
  DeleteResponseHeadersPolicyCommand,
  GetResponseHeadersPolicyConfigCommand,
  ListResponseHeadersPoliciesCommand,
  type ResponseHeadersPolicyConfig,
  UpdateResponseHeadersPolicyCommand } from '@aws-sdk/client-cloudfront';

import { createResource } from '../resource.js';
import { assert } from '../utils/assert.js';
import { collect } from '../utils/collect.js';
import { map } from '../utils/map.js';
import { paginated } from '../utils/paginated.js';

interface Params {
  readonly s3BucketName: string;
}

export default createResource('CloudFront Response Headers Policy', {
  async up({ createClient, cleanup }, { s3BucketName }: Params) {
    const client = createClient(CloudFrontClient);
    const ids = await findIds(client, s3BucketName);
    let id = ids.shift();

    if (id) {
      const { ETag } = await client.send(new GetResponseHeadersPolicyConfigCommand({ Id: id }));

      await client.send(new UpdateResponseHeadersPolicyCommand({
        Id: id,
        ResponseHeadersPolicyConfig: getResponseHeadersConfig(s3BucketName),
        IfMatch: ETag,
      }));
    }
    else {
      const { ResponseHeadersPolicy } = await client.send(new CreateResponseHeadersPolicyCommand({
        ResponseHeadersPolicyConfig: getResponseHeadersConfig(s3BucketName),
      }));

      assert(ResponseHeadersPolicy?.Id, `CloudFront response headers policy ID missing.`);
      id = ResponseHeadersPolicy.Id;
    }

    cleanup(async () => await deleteAll(client, ids));

    return { cloudFrontResponseHeadersPolicyId: id };
  },

  async down({ app, createClient }) {
    const client = createClient(CloudFrontClient);
    const ids = await findIds(client, app);
    await deleteAll(client, ids);
  },

  async get({ app, createClient }) {
    const client = createClient(CloudFrontClient);
    const ids = await findIds(client, app);
    return { cloudFrontResponseHeadersPolicyId: ids[0] ?? null };
  },
});

async function findIds(client: CloudFrontClient, bucketName: string): Promise<string[]> {
  return await collect(map(
    paginated(async (Marker) => {
      const result = await client.send(new ListResponseHeadersPoliciesCommand({ Marker, Type: 'custom' }));
      return { values: result.ResponseHeadersPolicyList?.Items, next: result.ResponseHeadersPolicyList?.NextMarker };
    }),
    async (policy) => {
      return policy.ResponseHeadersPolicy?.ResponseHeadersPolicyConfig?.Name === bucketName
        ? policy.ResponseHeadersPolicy.Id
        : undefined;
    },
  ));
}

async function deleteAll(client: CloudFrontClient, ids: string[]): Promise<void> {
  await collect(map(ids, async (id) => {
    const { ETag } = await client.send(new GetResponseHeadersPolicyConfigCommand({ Id: id }));
    await client.send(new DeleteResponseHeadersPolicyCommand({ Id: id, IfMatch: ETag }));
  }));
}

function getResponseHeadersConfig(s3BucketName: string): ResponseHeadersPolicyConfig {
  return {
    Name: s3BucketName,
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
