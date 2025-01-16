import assert from 'node:assert';

import { type AwsCredentialIdentityProvider } from '@smithy/types';

import { itemsWithQuantity } from '../client.js';
import { createAcmClient } from '../clients/acm.js';
import { type CdnConfig, createCdnClient } from '../clients/cdn.js';
import { type ResolvedConfig } from '../config.js';
import { type Components } from '../data/components.js';
import { createResource } from '../resource.js';
import { CDN_BUCKET_PREFIX_ARCHIVE, CDN_BUCKET_PREFIX_CURRENT } from './bucket.js';
import resourceCdnBucketPolicy from './cdn-bucket-policy.js';
import resourceCdnContent from './cdn-content.js';
import resourceCdnOac from './cdn-oac.js';
import resourceCdnPolicy, { CDN_RESPONSE_HEADERS_POLICY_KEY } from './cdn-policy.js';

const ORIGIN_CURRENT = 'current';
const ORIGIN_ARCHIVE = 'archive';
const ORIGIN_GROUP = 'fallback';

const POLICY_ID_MANAGED_CACHING_OPTIMIZED = '658327ea-f89d-4fab-a63d-7e88639e58f6';
const POLICY_ORIGIN_REQUEST_CORS_S3 = '88a5eaf4-2fd4-4709-b370-b4c650ea3fcf';

export default createResource({
  title: 'CDN',

  async up({ config, components, task, credentials }) {
    const certArn = await getAcmCertArn({ aliases: config.cdn.dns.aliases, credentials });
    const cdnConfig = await getCdnConfig({ config, components, certArn });
    const client = createCdnClient(credentials);

    let meta = await components.get('cdn');

    if (meta) {
      const success = await client.update(meta.id, cdnConfig);
      if (!success) meta = undefined;
    }

    if (!meta) {
      meta = await client.create(cdnConfig);
    }

    await components.resolve('cdn', meta);
    await task.step('Deploying...', async () => await client.waitForDeployment(meta.id));

    task.detail(`https://${meta.domain}`);
  },

  async down({ components, task, credentials }) {
    const meta = await components.get('cdn');

    if (!meta) return;

    const client = createCdnClient(credentials);

    await client.disable(meta.id);
    await task.step('Deploying...', async () => await client.waitForDeployment(meta.id));
    await client.delete(meta.id);
    await components.delete('cdn');
  },

  dependencies: [resourceCdnContent, resourceCdnOac, resourceCdnPolicy],
  dependents: [resourceCdnBucketPolicy],
});

async function getCdnConfig({ config, components, certArn }: {
  readonly config: ResolvedConfig;
  readonly components: Components;
  readonly certArn: string | undefined;
}): Promise<CdnConfig> {
  const bucket = components.getRequired('bucket');
  const oac = components.getRequired('cdn-oac');
  const headers = components.getRequired(CDN_RESPONSE_HEADERS_POLICY_KEY);
  const bucketDomain = `${bucket.name}.s3.${config.region}.amazonaws.com`;

  return {
    DefaultRootObject: config.cdn.responses.root,
    Origins: itemsWithQuantity([
      {
        Id: ORIGIN_CURRENT,
        DomainName: bucketDomain,
        OriginPath: `/${CDN_BUCKET_PREFIX_ARCHIVE}`,
        OriginAccessControlId: oac.id,
        S3OriginConfig: { OriginAccessIdentity: '' },
        CustomHeaders: itemsWithQuantity(),
      },
      {
        Id: ORIGIN_ARCHIVE,
        DomainName: bucketDomain,
        OriginPath: `/${CDN_BUCKET_PREFIX_CURRENT}`,
        OriginAccessControlId: oac.id,
        S3OriginConfig: { OriginAccessIdentity: '' },
        CustomHeaders: itemsWithQuantity(),
      },
    ]),
    OriginGroups: itemsWithQuantity([
      {
        Id: ORIGIN_GROUP,
        Members: itemsWithQuantity([
          { OriginId: ORIGIN_CURRENT },
          { OriginId: ORIGIN_ARCHIVE },
        ]),
        FailoverCriteria: {
          StatusCodes: itemsWithQuantity([404, 403]),
        },
      },
    ]),
    DefaultCacheBehavior: {
      AllowedMethods: {
        ...itemsWithQuantity(['GET', 'HEAD']),
        CachedMethods: itemsWithQuantity(['GET', 'HEAD']),
      },
      Compress: true,
      CachePolicyId: POLICY_ID_MANAGED_CACHING_OPTIMIZED,
      OriginRequestPolicyId: POLICY_ORIGIN_REQUEST_CORS_S3,
      ResponseHeadersPolicyId: headers.id,
      ViewerProtocolPolicy: 'redirect-to-https',
      TargetOriginId: ORIGIN_GROUP,
    },
    CacheBehaviors: itemsWithQuantity(),
    CustomErrorResponses: itemsWithQuantity(
      Object.entries(config.cdn.responses.errors),
      ([code, { path, status }]) => ({
        ErrorCode: Number.parseInt(code, 10),
        ResponsePagePath: path,
        ResponseCode: status.toString(10),
        ErrorCachingMinTTL: 0,
      }),
    ),
    ViewerCertificate: certArn == null
      ? {
          CloudFrontDefaultCertificate: true,
          MinimumProtocolVersion: 'TLSv1',
        }
      : {
          CloudFrontDefaultCertificate: false,
          ACMCertificateArn: certArn,
          MinimumProtocolVersion: 'TLSv1.2_2021',
          SSLSupportMethod: 'sni-only',
        },
    Aliases: itemsWithQuantity(config.cdn.dns.aliases),
  };
}

async function getAcmCertArn({ aliases, credentials }: {
  readonly aliases: readonly string[];
  readonly credentials: AwsCredentialIdentityProvider;
}): Promise<string | undefined> {
  if (aliases.length === 0) return;

  const client = createAcmClient(credentials);
  const arn = await client.find(aliases);

  // TODO: Create the cert if possible.
  assert(arn, `Missing certificate.`);

  return arn;
}
