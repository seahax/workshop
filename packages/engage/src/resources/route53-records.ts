import {
  ChangeResourceRecordSetsCommand,
  type HostedZone,
  ListHostedZonesCommand,
  Route53Client,
} from '@aws-sdk/client-route-53';

import { createResource } from '../resource.js';
import { collect } from '../utils/collect.js';
import { paginated } from '../utils/paginated.js';

interface Params {
  readonly domains: readonly string[];
  readonly distributionDomainName: string;
}

export default createResource('Route53 Records', {
  async up({ createClient }, { domains, distributionDomainName }: Params) {
    const client = createClient(Route53Client);

    if (domains.length <= 0) return;

    const zones = await collect(paginated(async (Marker) => {
      const { HostedZones, NextMarker } = await client.send(new ListHostedZonesCommand({ Marker }));
      return { values: HostedZones, next: NextMarker };
    }));

    for (const domain of domains) {
      const name = `${domain}.`;
      const zone = zones.reduce<HostedZone | undefined>((acc, zone) => {
        if (!zone.Name) return acc;
        if (name !== zone.Name && !name.endsWith(`.${zone.Name}`)) return acc;
        if (acc?.Name && acc.Name.length > zone.Name.length) return acc;
        return zone;
      }, undefined);

      if (!zone) continue;

      console.debug(`upsert zone record ${name}`);
      await client.send(new ChangeResourceRecordSetsCommand({
        HostedZoneId: zone.Id,
        ChangeBatch: {
          Changes: [
            {
              Action: 'UPSERT',
              ResourceRecordSet: {
                Type: 'A',
                Name: name,
                AliasTarget: {
                  DNSName: distributionDomainName,
                  HostedZoneId: 'Z2FDTNDATAQYW2',
                  EvaluateTargetHealth: false,
                },
              },
            },
          ],
        },
      }));
    }
  },
});
