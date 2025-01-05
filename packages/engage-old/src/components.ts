import { DynamoDBClient, GetItemCommand, TransactWriteItemsCommand } from '@aws-sdk/client-dynamodb';
import { type AwsCredentialIdentityProvider } from '@smithy/types';

import { TABLE_COMPONENT_IDS, TABLE_COMPONENTS } from './constants/tables.js';
import { id } from './utils/id.js';
import { silence } from './utils/silence.js';
import { createTable } from './utils/table.js';

interface Params {
  readonly app: string;
  readonly credentials: AwsCredentialIdentityProvider;
}

type ComponentType = 'app';

export interface Components {
  getId(this: void, type: ComponentType, name?: string): Promise<string | undefined>;
  requireId(this: void, type: ComponentType, name?: string): Promise<string>;
}

export function createComponents({ app, credentials }: Params): Components {
  const client = new DynamoDBClient({ credentials, region: 'us-east-1' });

  async function getId(type: ComponentType, name: string | undefined): Promise<string | undefined> {
    const result = await client.send(new GetItemCommand({
      TableName: TABLE_COMPONENTS,
      ConsistentRead: true,
      Key: getKey(type, name),
    }));

    return result.Item?.AppId ? result.Item.AppId.S : undefined;
  }

  function getKey(type: ComponentType, name: string | undefined): { Scope: { S: string }; Name: { S: string } } {
    return {
      Scope: { S: JSON.stringify([app, type]) },
      Name: { S: JSON.stringify([name ?? '']) },
    };
  }

  return {
    async getId(type, name) {
      return await silence(['ResourceNotFoundException'], getId(type, name));
    },
    async requireId(type, name) {
      await Promise.all([
        createTable({ client, name: TABLE_COMPONENTS, partition: 'Scope', sort: 'Name' }),
        createTable({ client, name: TABLE_COMPONENT_IDS, partition: 'Id' }),
      ]);

      let componentId = await getId(type, name);

      if (componentId == null) {
        componentId = id();

        await client.send(new TransactWriteItemsCommand({
          ClientRequestToken: app,
          TransactItems: [
            {
              Put: {
                TableName: TABLE_COMPONENT_IDS,
                Item: {
                  AppId: { S: appId },
                },
                ConditionExpression: 'attribute_not_exists(AppId)',
              },
            },
            {
              Put: {
                TableName: TABLE_COMPONENTS,
                Item: { AppName: { S: app }, AppId: { S: appId } },
                ConditionExpression: 'attribute_not_exists(AppName)',
              },
            },
          ],
        }));
      }
    },
  };
}

export async function getComponentId({ app, credentials }: Params): Promise<string | undefined> {
  const client = new DynamoDBClient({ credentials, region: 'us-east-1' });

  return await silence(['ResourceNotFoundException'], _getAppId(client, app));
}

export async function createAppId({ app, credentials }: Params): Promise<string> {
  const client = new DynamoDBClient({ credentials, region: 'us-east-1' });

  await Promise.all([
    createTable({ client, name: TABLE_COMPONENTS, partition: 'Scope', sort: 'Name' }),
    createTable({ client, name: TABLE_COMPONENT_IDS, partition: 'Id' }),
  ]);

  let appId = await _getAppId(client, app);

  if (appId == null) {
    appId = id();

    await client.send(new TransactWriteItemsCommand({
      ClientRequestToken: app,
      TransactItems: [
        {
          Put: {
            TableName: TABLE_APP_IDS,
            Item: { AppId: { S: appId } },
            ConditionExpression: 'attribute_not_exists(AppId)',
          },
        },
        {
          Put: {
            TableName: TABLE_COMPONENTS,
            Item: { AppName: { S: app }, AppId: { S: appId } },
            ConditionExpression: 'attribute_not_exists(AppName)',
          },
        },
      ],
    }));
  }

  return appId;
}

async function _getAppId(client: DynamoDBClient, app: string): Promise<string | undefined> {
  const result = await client.send(new GetItemCommand({
    TableName: TABLE_COMPONENTS,
    ConsistentRead: true,
    Key: { AppName: { S: app } },
  }));

  return result.Item?.AppId ? result.Item.AppId.S : undefined;
}
