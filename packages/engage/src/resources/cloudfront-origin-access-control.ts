import {
  CloudFrontClient,
  CreateOriginAccessControlCommand,
  DeleteOriginAccessControlCommand,
  GetOriginAccessControlCommand,
  ListOriginAccessControlsCommand,
  type OriginAccessControlConfig,
  UpdateOriginAccessControlCommand,
} from '@aws-sdk/client-cloudfront';

import { createResource } from '../resource.js';
import { assert } from '../utils/assert.js';
import { collect } from '../utils/collect.js';
import { map } from '../utils/map.js';
import { paginated } from '../utils/paginated.js';

interface Params {
  readonly s3BucketName: string;
}

export default createResource('CloudFront Origin Access Control', {
  async up({ createClient, cleanup }, { s3BucketName }: Params) {
    const client = createClient(CloudFrontClient);
    const ids = await findIds(client, s3BucketName);
    let id = ids.shift();

    if (id) {
      const { ETag } = await client.send(new GetOriginAccessControlCommand({ Id: id }));

      await client.send(new UpdateOriginAccessControlCommand({
        Id: id,
        OriginAccessControlConfig: getOacConfig(s3BucketName),
        IfMatch: ETag,
      }));
    }
    else {
      const result = await client.send(new CreateOriginAccessControlCommand({
        OriginAccessControlConfig: getOacConfig(s3BucketName),
      }));

      assert(result.OriginAccessControl?.Id, `CloudFront origin access control ID missing.`);
      id = result.OriginAccessControl.Id;
    }

    cleanup(async () => await deleteAll(client, ids));

    return { cloudFrontOriginAccessControlId: id };
  },

  async down({ app, createClient }): Promise<void> {
    const client = createClient(CloudFrontClient);
    const ids = await findIds(client, app);
    await deleteAll(client, ids);
  },

  async get({ app, createClient }) {
    const client = createClient(CloudFrontClient);
    const ids = await findIds(client, app);
    return { cloudFrontOriginAccessControlId: ids[0] ?? null };
  },
});

async function findIds(client: CloudFrontClient, s3BucketName: string): Promise<string[]> {
  return await collect(map(
    paginated(async (Marker) => {
      const result = await client.send(new ListOriginAccessControlsCommand({ Marker }));
      return { values: result.OriginAccessControlList?.Items, next: result.OriginAccessControlList?.NextMarker };
    }),
    async (oac) => {
      return oac.Name === s3BucketName ? oac.Id : undefined;
    },
  ));
}

async function deleteAll(client: CloudFrontClient, ids: string[]): Promise<void> {
  await collect(map(ids, async (id) => {
    const { ETag } = await client.send(new GetOriginAccessControlCommand({ Id: id }));
    await client.send(new DeleteOriginAccessControlCommand({ Id: id, IfMatch: ETag }));
  }));
}

function getOacConfig(s3BucketName: string): OriginAccessControlConfig {
  return {
    Name: s3BucketName,
    OriginAccessControlOriginType: 's3',
    SigningBehavior: 'always',
    SigningProtocol: 'sigv4',
  };
}
