import { type OriginAccessControlConfig } from '@aws-sdk/client-cloudfront';

import { createCdnOacClient } from '../clients/cdn-oac.js';
import { createResource } from '../resource.js';

export default createResource({
  title: 'CDN > Origin Access Control',

  async up({ components, credentials }) {
    const bucket = components.getRequired('bucket');
    const client = createCdnOacClient(credentials);
    const config: OriginAccessControlConfig = {
      Name: bucket.name,
      OriginAccessControlOriginType: 's3',
      SigningBehavior: 'always',
      SigningProtocol: 'sigv4',
    };

    let meta = await components.get('cdn-oac');

    if (meta) {
      const updated = await client.updateOac(meta.id, config);
      if (!updated) meta = undefined;
    }

    if (!meta) {
      meta = { id: await client.createOac(config) };
    }

    await components.resolve('cdn-oac', meta);
  },

  async down({ components, credentials }) {
    const meta = await components.get('cdn-oac');

    if (meta) {
      const client = createCdnOacClient(credentials);
      await client.deleteOac(meta.id);
      await components.delete('cdn-oac');
    }
  },
});
