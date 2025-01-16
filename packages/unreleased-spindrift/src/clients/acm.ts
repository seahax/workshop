import {
  ACMClient,
  type CertificateDetail,
  DescribeCertificateCommand,
  ListCertificatesCommand,
  ResourceNotFoundException,
} from '@aws-sdk/client-acm';

import { createClientFactory } from '../client.js';
import { paginated } from '../utils/paginated.js';
import { silence } from '../utils/silence.js';

export const createAcmClient = createClientFactory((credentials) => {
  const client = new ACMClient({ region: 'us-east-1', credentials });

  return {
    async find(domains: readonly string[]) {
      if (domains.length <= 0) return;

      const certificates = paginated(async (NextToken) => {
        const result = await client.send(new ListCertificatesCommand({
          CertificateStatuses: ['ISSUED'],
          Includes: {
            extendedKeyUsage: ['TLS_WEB_SERVER_AUTHENTICATION'],
            keyTypes: ['RSA_2048', 'EC_prime256v1'],
          },
          SortBy: 'CREATED_AT',
          SortOrder: 'DESCENDING',
          NextToken,
        }));

        return { values: result.CertificateSummaryList, next: result.NextToken };
      });

      for await (const certificate of certificates) {
        const arn = certificate.CertificateArn!;
        const { Certificate } = await client.send(new DescribeCertificateCommand({ CertificateArn: arn }));

        return isMatch(Certificate!, domains) ? arn : undefined;
      }
    },

    async validate(arn: string): Promise<boolean> {
      const result = await silence(
        [ResourceNotFoundException],
        client.send(new DescribeCertificateCommand({ CertificateArn: arn })),
      );

      return result ? isMatch(result.Certificate!, []) : false;
    },
  };
});

function isMatch(Certificate: CertificateDetail, domains: readonly string[]): boolean {
  const certDomains = [Certificate.DomainName!, ...Certificate.SubjectAlternativeNames ?? []];

  return domains.every((domain) => certDomains.some((certDomain) => {
    return certDomain.startsWith('*.') ? domain.endsWith(certDomain.slice(2)) : certDomain === domain;
  }));
}
