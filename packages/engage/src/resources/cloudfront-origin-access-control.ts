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
import { paginated } from '../utils/paginated.js';

export default createResource('CloudFront Origin Access Control', {
  async up({ app, createClient }) {
    const client = createClient(CloudFrontClient);
    let id = await findId(client, app);

    if (id) {
      const { ETag } = await client.send(new GetOriginAccessControlCommand({ Id: id }));

      await client.send(new UpdateOriginAccessControlCommand({
        Id: id,
        OriginAccessControlConfig: getOacConfig(app),
        IfMatch: ETag,
      }));
    }
    else {
      const result = await client.send(new CreateOriginAccessControlCommand({
        OriginAccessControlConfig: getOacConfig(app),
      }));

      assert(result.OriginAccessControl?.Id, `CloudFront origin access control ID missing.`);
      id = result.OriginAccessControl.Id;
    }

    return { originAccessControlId: id };
  },

  async down({ app, createClient }): Promise<void> {
    const client = createClient(CloudFrontClient);
    const id = await findId(client, app);

    if (!id) return;

    const { ETag } = await client.send(new GetOriginAccessControlCommand({ Id: id }));

    await client.send(new DeleteOriginAccessControlCommand({ Id: id, IfMatch: ETag }));
  },
});

async function findId(client: CloudFrontClient, app: string): Promise<string | undefined> {
  const oacs = paginated(async (Marker) => {
    const result = await client.send(new ListOriginAccessControlsCommand({ Marker }));
    return { values: result.OriginAccessControlList?.Items, next: result.OriginAccessControlList?.NextMarker };
  });

  for await (const oac of oacs) {
    if (oac.Name === `e4e-${app}`) {
      return oac.Id!;
    }
  }
}

function getOacConfig(app: string): OriginAccessControlConfig {
  return {
    Name: `e4e-${app}`,
    OriginAccessControlOriginType: 's3',
    SigningBehavior: 'always',
    SigningProtocol: 'sigv4',
  };
}
