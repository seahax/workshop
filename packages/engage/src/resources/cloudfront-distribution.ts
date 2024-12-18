/* eslint-disable max-lines */
import { randomUUID } from 'node:crypto';

import { ACMClient, DescribeCertificateCommand, ListCertificatesCommand } from '@aws-sdk/client-acm';
import {
  CloudFrontClient,
  CreateDistributionWithTagsCommand,
  type CustomErrorResponse,
  DeleteDistributionCommand,
  type DistributionConfig,
  GetDistributionCommand,
  GetDistributionConfigCommand,
  ListDistributionsCommand,
  ListTagsForResourceCommand,
  UpdateDistributionCommand,
  waitUntilDistributionDeployed,
} from '@aws-sdk/client-cloudfront';

import { BUCKET_PREFIX_ARCHIVE, BUCKET_PREFIX_CURRENT } from '../constants/bucket-prefixes.js';
import { TAG_NAME } from '../constants/tags.js';
import { type Context } from '../context.js';
import { createResource } from '../resource.js';
import { assert } from '../utils/assert.js';
import { paginated } from '../utils/paginated.js';
import { spinner } from '../utils/spinner.js';

interface Params {
  readonly domains: readonly string[];
  readonly responses: {
    readonly root?: string;
    readonly errors: Readonly<Record<number, { readonly path: string; readonly status: number }>>;
  };
  readonly originAccessControlId: string;
  readonly responseHeadersPolicyId: string;
}

interface DistributionConfigOptions extends Params {
  readonly app: string;
  readonly accountId: string;
  readonly region: string;
  readonly certificateArn: string | undefined;
  readonly current: Partial<DistributionConfig>;
}

const ORIGIN_CURRENT = 'current';
const ORIGIN_ARCHIVE = 'archive';
const ORIGIN_GROUP = 'fallback';

export default createResource('CloudFront Distribution', {
  async up(ctx, { domains, responses, originAccessControlId, responseHeadersPolicyId }: Params) {
    const { app, region, createClient, getAccountId } = ctx;
    const client = createClient(CloudFrontClient);
    const accountId = await getAccountId();
    let id = await findId(client, app);
    let domainName: string;
    let certificateArns: readonly string[] | undefined;

    if (domains.length > 0) {
      certificateArns = await findCertificateArns(ctx, domains);
      assert(certificateArns.length > 0, `ACM certificate missing (RSA-2048 or ECDSA P-256, issued in us-east-1).`);
    }

    if (id) {
      const { ETag, DistributionConfig } = await client.send(new GetDistributionConfigCommand({ Id: id }));

      assert(DistributionConfig, `CloudFront distribution missing.`);

      const certificateArn
        = DistributionConfig.ViewerCertificate?.ACMCertificateArn
        && certificateArns?.includes(DistributionConfig.ViewerCertificate.ACMCertificateArn)
          ? DistributionConfig.ViewerCertificate.ACMCertificateArn
          : certificateArns?.[0];

      const result = await client.send(new UpdateDistributionCommand({
        Id: id,
        IfMatch: ETag,
        DistributionConfig: getDistributionConfig({
          domains,
          responses,
          originAccessControlId,
          responseHeadersPolicyId,
          app,
          accountId,
          region,
          certificateArn,
          current: DistributionConfig,
        }),
      }));

      assert(result.Distribution?.DomainName, `CloudFront distribution domain name missing.`);

      domainName = result.Distribution.DomainName;
    }
    else {
      const { Distribution } = await client.send(new CreateDistributionWithTagsCommand({
        DistributionConfigWithTags: {
          DistributionConfig: getDistributionConfig({
            domains,
            responses,
            originAccessControlId,
            responseHeadersPolicyId,
            app,
            accountId,
            region,
            certificateArn: certificateArns?.[0],
            current: { CallerReference: randomUUID() },
          }),
          Tags: { Items: [{ Key: TAG_NAME, Value: app }] },
        },
      }));

      assert(Distribution?.Id, `CloudFront distribution ID missing.`);
      assert(Distribution.DomainName, `CloudFront distribution domain name missing.`);

      id = Distribution.Id;
      domainName = Distribution.DomainName;
    }

    spinner.suffixText = 'Deploying...';
    await waitUntilDistributionDeployed(
      { client, maxWaitTime: 900, maxDelay: 30, minDelay: 5 },
      { Id: id },
    );
    spinner.suffixText = '';

    return {
      distributionId: id,
      distributionDomainName: domainName,
    };
  },

  async down({ app, createClient }) {
    const client = createClient(CloudFrontClient);
    const id = await findId(client, app);

    if (id) {
      const { ETag: ETag0, DistributionConfig } = await client.send(new GetDistributionConfigCommand({ Id: id }));

      if (!DistributionConfig) {
        return;
      }

      const { ETag: ETag1 } = await client.send(new UpdateDistributionCommand({
        Id: id,
        IfMatch: ETag0,
        DistributionConfig: { ...DistributionConfig, Enabled: false },
      }));

      spinner.suffixText = 'Deploying...';
      await waitUntilDistributionDeployed(
        { client, maxWaitTime: 900, maxDelay: 30, minDelay: 5 },
        { Id: id },
      );
      spinner.suffixText = '';

      await client.send(new DeleteDistributionCommand({ Id: id, IfMatch: ETag1 }));
    }
  },

  async get({ app, createClient }, { domains = [] }: Partial<Pick<Params, 'domains'>> = {}) {
    const client = createClient(CloudFrontClient);
    const id = await findId(client, app);

    if (!id) return;

    const { Distribution } = await client.send(new GetDistributionCommand({ Id: id }));

    assert(Distribution, `CloudFront distribution missing.`);
    assert(Distribution.DomainName, `CloudFront distribution domain name missing.`);

    const domainName = Distribution.DomainName;
    const certificateArn = Distribution.DistributionConfig?.ViewerCertificate?.ACMCertificateArn;

    return {
      distributionId: id,
      distributionDomainName: domainName,
      distributionUrls: [domainName, ...(certificateArn ? domains : [])]
        .map((domain) => `https://${domain}`),
    };
  },
});

async function findId(client: CloudFrontClient, app: string): Promise<string | undefined> {
  const distributions = paginated(async (Marker) => {
    const { DistributionList } = await client.send(new ListDistributionsCommand({ Marker }));

    return { values: DistributionList?.Items, next: DistributionList?.NextMarker };
  });

  for await (const distribution of distributions) {
    const { Tags } = await client.send(new ListTagsForResourceCommand({ Resource: distribution.ARN }));
    const tagName = Tags?.Items?.find((tag) => tag.Key === TAG_NAME)?.Value;

    if (tagName === app) {
      return distribution.Id;
    }
  }
}

async function findCertificateArns({ createClient }: Context, domains: readonly string[]): Promise<readonly string[]> {
  const client = createClient(ACMClient, { region: 'us-east-1' });
  const certificates = paginated(async (NextToken) => {
    const result = await client.send(new ListCertificatesCommand({
      CertificateStatuses: ['ISSUED'],
      Includes: {
        extendedKeyUsage: ['TLS_WEB_SERVER_AUTHENTICATION'],
        keyTypes: ['RSA_2048', 'EC_prime256v1'],
      },
      NextToken,
      SortBy: 'CREATED_AT',
      SortOrder: 'DESCENDING',
    }));

    return { values: result.CertificateSummaryList, next: result.NextToken };
  });

  const arns: string[] = [];

  for await (const certificate of certificates) {
    const { Certificate } = await client.send(new DescribeCertificateCommand({
      CertificateArn: certificate.CertificateArn,
    }));
    const certDomains = [Certificate?.DomainName, ...Certificate?.SubjectAlternativeNames ?? []]
      .filter((sn): sn is string => sn != null);
    const isMatch = domains.every((domain) => certDomains.some((certDomain) => {
      return certDomain.startsWith('*.') ? domain.endsWith(certDomain.slice(2)) : certDomain === domain;
    }));

    if (isMatch) {
      arns.push(certificate.CertificateArn!);
    }
  }

  return arns;
}

function getDistributionConfig({
  domains,
  responses,
  originAccessControlId,
  responseHeadersPolicyId,
  app,
  accountId,
  region,
  certificateArn,
  current,
}: DistributionConfigOptions): DistributionConfig {
  const DomainName = `e4e-${app}-${accountId}.s3.${region}.amazonaws.com`;
  const errorItems = Object.entries(responses.errors).map(([code, { path, status }]): CustomErrorResponse => ({
    ErrorCode: Number.parseInt(code, 10),
    ResponsePagePath: path,
    ResponseCode: status.toString(10),
    ErrorCachingMinTTL: 0,
  }));

  return {
    ...current,
    CallerReference: current.CallerReference ?? randomUUID(),
    Enabled: true,
    Comment: `Distribution created by @seahax/engage.`,
    PriceClass: 'PriceClass_All',
    DefaultRootObject: responses.root?.replace(/^\/+/u, ''),
    HttpVersion: 'http2and3',
    Origins: {
      Quantity: 2,
      Items: [
        {
          Id: ORIGIN_CURRENT,
          DomainName,
          OriginPath: `/${BUCKET_PREFIX_CURRENT.replaceAll(/^\/+|\/+$/gu, '')}`,
          OriginAccessControlId: originAccessControlId,
          S3OriginConfig: { OriginAccessIdentity: '' },
          CustomHeaders: { Quantity: 0 },
        },
        {
          Id: ORIGIN_ARCHIVE,
          DomainName,
          OriginPath: `/${BUCKET_PREFIX_ARCHIVE.replaceAll(/^\/+|\/+$/gu, '')}`,
          OriginAccessControlId: originAccessControlId,
          S3OriginConfig: { OriginAccessIdentity: '' },
          CustomHeaders: { Quantity: 0 },
        },
      ],
    },
    OriginGroups: {
      Quantity: 1,
      Items: [
        {
          Id: ORIGIN_GROUP,
          Members: {
            Quantity: 2,
            Items: [
              { OriginId: ORIGIN_CURRENT },
              { OriginId: ORIGIN_ARCHIVE },
            ],
          },
          FailoverCriteria: {
            StatusCodes: {
              Quantity: 2,
              Items: [404, 403],
            },
          },
        },
      ],
    },
    DefaultCacheBehavior: {
      ...current.DefaultCacheBehavior,
      AllowedMethods: {
        Quantity: 3,
        Items: ['GET', 'HEAD', 'OPTIONS'],
        CachedMethods: {
          Quantity: 3,
          Items: ['GET', 'HEAD', 'OPTIONS'],
        },
      },
      Compress: true,
      // https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/using-managed-cache-policies.html#managed-cache-caching-optimized
      CachePolicyId: '658327ea-f89d-4fab-a63d-7e88639e58f6',
      // https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/using-managed-origin-request-policies.html#managed-origin-request-policy-cors-s3
      OriginRequestPolicyId: '88a5eaf4-2fd4-4709-b370-b4c650ea3fcf',
      ResponseHeadersPolicyId: responseHeadersPolicyId,
      ViewerProtocolPolicy: 'redirect-to-https',
      TargetOriginId: ORIGIN_GROUP,
    },
    CustomErrorResponses: {
      Quantity: errorItems.length,
      Items: errorItems,
    },
    ViewerCertificate: certificateArn && domains.length > 0
      ? {
          CloudFrontDefaultCertificate: false,
          ACMCertificateArn: certificateArn,
          MinimumProtocolVersion: 'TLSv1.2_2021',
          SSLSupportMethod: 'sni-only',
        }
      : {
          CloudFrontDefaultCertificate: true,
          MinimumProtocolVersion: 'TLSv1',
        },
    Aliases: certificateArn && domains.length > 0
      ? {
          Quantity: domains.length,
          Items: [...domains],
        }
      : { Quantity: 0 },
  };
}
