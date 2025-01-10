import {
  ChangeResourceRecordSetsCommand,
  ListHostedZonesCommand,
  ListResourceRecordSetsCommand,
  Route53Client,
} from '@aws-sdk/client-route-53';

import { TAG_NAME } from '../constants/tags.js';
import { createResource } from '../resource.js';
import { collect } from '../utils/collect.js';
import { map } from '../utils/map.js';
import { paginated } from '../utils/paginated.js';

interface Record {
  readonly zoneId: string;
  readonly name: string;
}

interface Params {
  readonly cloudFrontDistributionDomainName: string;
  readonly domains: readonly string[];
}

/**
 * The ID of Route53 hosted zone used internally by AWS for CloudFront
 * distribution subdomains.
 */
const AWS_CLOUD_FRONT_ZONE_ID = 'Z2FDTNDATAQYW2';

export default createResource('Route53 Records', {
  async up({ app, createClient, cleanup }, { cloudFrontDistributionDomainName, domains }: Params) {
    const client = createClient(Route53Client);
    const identifier = `${TAG_NAME}=${app}`;
    const zones = await getZones(client);
    const records = await getRecords(client, identifier, zones);

    for (const domain of domains) {
      const name = `${domain}.`;
      const zone = zones.find((zone) => name === zone.name || name.endsWith(`.${zone.name}`));

      if (!zone) continue;

      records.delete(getRecordKey({ zoneId: zone.zoneId, name }));

      await client.send(new ChangeResourceRecordSetsCommand({
        HostedZoneId: zone.zoneId,
        ChangeBatch: {
          Changes: [
            {
              Action: 'UPSERT',
              ResourceRecordSet: {
                Type: 'A',
                Name: name,
                SetIdentifier: identifier,
                Weight: 100,
                AliasTarget: {
                  DNSName: cloudFrontDistributionDomainName,
                  HostedZoneId: AWS_CLOUD_FRONT_ZONE_ID,
                  EvaluateTargetHealth: false,
                },
              },
            },
          ],
        },
      }));
    }

    cleanup(async () => await deleteAll(client, identifier, records.values()));
  },

  async down({ app, createClient }) {
    const client = createClient(Route53Client);
    const identifier = `${TAG_NAME}=${app}`;
    const zones = await getZones(client);
    const records = await getRecords(client, identifier, zones);
    await deleteAll(client, identifier, records.values());
  },
});

async function deleteAll(client: Route53Client, identifier: string, records: Iterable<Record>): Promise<void> {
  const groups = new Map<string, string[]>();

  for (const record of records) {
    groups.set(record.zoneId, [...(groups.get(record.zoneId) ?? []), record.name]);
  }

  await collect(map(groups.entries(), async ([zoneId, names]) => {
    await client.send(new ChangeResourceRecordSetsCommand({
      HostedZoneId: zoneId,
      ChangeBatch: {
        Changes: names.map((name) => ({
          Action: 'DELETE',
          ResourceRecordSet: {
            Type: 'A',
            Name: name,
            SetIdentifier: identifier,
          },
        })),
      },
    }));
  }));
}

async function getRecords(client: Route53Client, identifier: string, zones: Record[]): Promise<Map<string, Record>> {
  const records = new Map<string, Record>();

  for (const zone of zones) {
    const names = await getZoneRecordNames(client, identifier, zone.zoneId);

    names.forEach((name) => {
      const record = { zoneId: zone.zoneId, name };
      records.set(getRecordKey(record), record);
    });
  }

  return records;
};

async function getZoneRecordNames(client: Route53Client, identifier: string, zoneId: string): Promise<string[]> {
  return await collect(map(
    paginated(async (StartRecordName) => {
      const result = await client.send(new ListResourceRecordSetsCommand({
        HostedZoneId: zoneId,
        StartRecordName,
        StartRecordIdentifier: identifier,
      }));
      return { values: result.ResourceRecordSets, next: result.NextRecordName };
    }),
    async (record) => record.Name,
  ));
}

async function getZones(client: Route53Client): Promise<Record[]> {
  const zones = await collect(map(
    paginated(async (Marker) => {
      const result = await client.send(new ListHostedZonesCommand({ Marker }));
      return { values: result.HostedZones, next: result.NextMarker };
    }),
    async (zone): Promise<Record> => ({ zoneId: zone.Id!, name: zone.Name! }),
  ));

  return zones.sort((a, b) => b.name.localeCompare(a.name));
}

function getRecordKey(record: Record): string {
  return `${record.zoneId}:${record.name}`;
}
