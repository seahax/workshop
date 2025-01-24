import { createCdnPolicyClient } from '../clients/cdn-policy.js';
import { createResource } from '../resource.js';

export const CDN_RESPONSE_HEADERS_POLICY_KEY = 'cdn-policy.$response-headers';

export default createResource({
  title: 'CDN > Policies',

  async up({ config, user, components }) {
    const client = createCdnPolicyClient(user);

    let meta = await components.get(CDN_RESPONSE_HEADERS_POLICY_KEY);

    if (meta) {
      const updated = await client.updateResponseHeadersPolicy(meta.id, config.cdn.responses.headers);
      if (!updated) meta = undefined;
    }

    if (!meta) {
      const name = await components.createId();
      const id = await client.createResponseHeadersPolicy(name, config.cdn.responses.headers);
      meta = { id, name };
    }

    await components.resolve(CDN_RESPONSE_HEADERS_POLICY_KEY, meta);
  },

  async down({ user, components }) {
    const meta = await components.get(CDN_RESPONSE_HEADERS_POLICY_KEY);

    if (meta) {
      const client = createCdnPolicyClient(user);
      await client.deleteResponseHeadersPolicy(meta.id);
      await components.delete(CDN_RESPONSE_HEADERS_POLICY_KEY);
    }
  },
});
