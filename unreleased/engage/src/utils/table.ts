import {
  type AttributeDefinition,
  CreateTableCommand,
  type DynamoDBClient,
  type KeySchemaElement,
  waitUntilTableExists,
} from '@aws-sdk/client-dynamodb';

import { silence } from './silence.js';

interface Params {
  readonly client: DynamoDBClient;
  readonly name: string;
  readonly partition: string;
  readonly sort?: string;
}

export async function createTable({ client, name, partition, sort }: Params): Promise<void> {
  await silence(['ResourceInUseException'], client.send(new CreateTableCommand({
    TableName: name,
    AttributeDefinitions: [
      { AttributeName: partition, AttributeType: 'S' },
      ...(sort ? [{ AttributeName: sort, AttributeType: 'S' }] : []) satisfies AttributeDefinition[],
    ],
    KeySchema: [
      { AttributeName: partition, KeyType: 'HASH' },
      ...(sort ? [{ AttributeName: sort, KeyType: 'RANGE' }] : []) satisfies KeySchemaElement[],
    ],
    BillingMode: 'PAY_PER_REQUEST',
  })));

  await waitUntilTableExists({ client, maxWaitTime: 900, maxDelay: 30, minDelay: 5 }, { TableName: name });
}
