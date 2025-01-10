import {
  CreateTableCommand,
  DynamoDBClient,
  ResourceInUseException,
  ResourceNotFoundException,
  TransactionCanceledException,
  waitUntilTableExists,
} from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { type AwsCredentialIdentityProvider } from '@smithy/types';

import { createId } from '../utils/id.js';
import { lazy } from '../utils/lazy.js';
import { silence } from '../utils/silence.js';

interface KeyKey {
  readonly [ATTR_KEY_TYPE]: 'key';
  readonly [ATTR_KEY]: AppKeyString;
}

interface IdKey {
  readonly [ATTR_KEY_TYPE]: 'id';
  readonly [ATTR_KEY]: AppIdString;
}

interface KeyItem {
  readonly [ATTR_KEY_TYPE]: 'key';
  readonly [ATTR_KEY]: AppKeyString;
  readonly [ATTR_VALUE]: AppIdString;
  readonly [ATTR_CREATED]: string;
}

interface IdItem {
  readonly [ATTR_KEY_TYPE]: 'id';
  readonly [ATTR_KEY]: AppIdString;
  readonly [ATTR_VALUE]: AppKeyString;
  readonly [ATTR_CREATED]: string;
}

interface Params {
  readonly appKey: AppKey;
  readonly credentials: AwsCredentialIdentityProvider;
}

export type AppKeyString = `["${string}","${string}"]`;
export type AppIdString = `engage-${string}`;

export interface AppKey {
  readonly name: string;
  readonly region: string;
  toString(): AppKeyString;
}

export interface App {
  resolve(): Promise<AppIdString>;
  delete(): Promise<void>;
}

const TABLE = 'engage-apps';
const ATTR_KEY_TYPE = 'kt';
const ATTR_KEY = 'k';
const ATTR_VALUE = 'v';
const ATTR_CREATED = 'ct';

export function createAppKey({ name, region }: Pick<AppKey, 'name' | 'region'>): AppKey {
  return {
    name,
    region,
    toString() {
      return JSON.stringify([this.name, this.region]) as AppKeyString;
    },
  };
}

export async function createApp({ appKey, credentials }: Params): Promise<App> {
  const client = DynamoDBDocument.from(new DynamoDBClient({ region: 'us-east-1', credentials }));

  return {
    resolve: lazy(async () => {
      // Try to create the table if necessary.
      await silence([ResourceInUseException], client.send(new CreateTableCommand({
        TableName: TABLE,
        AttributeDefinitions: [
          { AttributeName: ATTR_KEY_TYPE, AttributeType: 'S' },
          { AttributeName: ATTR_KEY, AttributeType: 'S' },
        ],
        KeySchema: [
          { AttributeName: ATTR_KEY_TYPE, KeyType: 'HASH' },
          { AttributeName: ATTR_KEY, KeyType: 'RANGE' },
        ],
        BillingMode: 'PAY_PER_REQUEST',
        DeletionProtectionEnabled: true,
      })));

      await waitUntilTableExists({ client, maxWaitTime: 900, maxDelay: 30, minDelay: 5 }, { TableName: TABLE });

      for (let i = 0; i < 5; ++i) {
        let id = await getId();

        if (id) return id;

        // Try to create the app items (id->name and name->id).
        id = createAppId();

        const createdTime = new Date().toISOString();
        const created = await silence([TransactionCanceledException], client.transactWrite({
          TransactItems: [
            {
              Put: {
                TableName: TABLE,
                Item: {
                  [ATTR_KEY_TYPE]: 'id',
                  [ATTR_KEY]: id,
                  [ATTR_VALUE]: appKey.toString(),
                  [ATTR_CREATED]: createdTime,
                } satisfies IdItem,
                ConditionExpression: `attribute_not_exists(${ATTR_VALUE})`,
              },
            },
            {
              Put: {
                TableName: TABLE,
                Item: {
                  [ATTR_KEY_TYPE]: 'key',
                  [ATTR_KEY]: appKey.toString(),
                  [ATTR_VALUE]: id,
                  [ATTR_CREATED]: createdTime,
                } satisfies KeyItem,
                ConditionExpression: `attribute_not_exists(${ATTR_VALUE})`,
              },
            },
          ],
        }));

        if (created) return id;
      }

      throw new Error('Failed to get or create the app ID.');
    }),

    async delete() {
      await silence([ResourceNotFoundException], async () => {
        const id = await getId();

        await client.transactWrite({
          TransactItems: [
            ...(id
              ? [{
                  Delete: {
                    TableName: TABLE,
                    Key: { [ATTR_KEY_TYPE]: 'id', [ATTR_KEY]: id } satisfies IdKey,
                  },
                }]
              : []),
            {
              Delete: {
                TableName: TABLE,
                Key: { [ATTR_KEY_TYPE]: 'key', [ATTR_KEY]: appKey.toString() } satisfies KeyKey,
              },
            },
          ],
        });
      });
    },
  };

  async function getId(): Promise<AppIdString | undefined> {
    const result = await client.get({
      TableName: TABLE,
      Key: { [ATTR_KEY_TYPE]: 'key', [ATTR_KEY]: appKey.toString() } satisfies KeyKey,
      ConsistentRead: true,
    });

    return (result.Item as KeyItem | undefined)?.[ATTR_VALUE];
  }

  function createAppId(): AppIdString {
    return `engage-${createId(12)}`;
  }
}
