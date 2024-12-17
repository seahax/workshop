import {
  CreateTableCommand,
  DeleteItemCommand,
  DynamoDB,
  PutItemCommand,
  UpdateTimeToLiveCommand,
  waitUntilTableExists,
} from '@aws-sdk/client-dynamodb';

import { type Context } from '../context.js';
import { silence } from './silence.js';

const LOCK_TABLE = 'engage-locks';
const LOCK_SECONDS = 1800; // 30 minutes.
const LOCK_EXTEND_INTERVAL_SECONDS = 300; // 5 minutes.

export async function lock<T>({ app, createClient }: Context, callback: () => Promise<T>): Promise<T> {
  const client = createClient(DynamoDB, { region: 'us-east-1' });
  const now = nowSeconds();
  let expiration = (now + LOCK_SECONDS);
  let updateTimeout: NodeJS.Timeout | undefined;
  let updatePromise: Promise<void> | undefined;

  try {
    await client.send(new CreateTableCommand({
      TableName: LOCK_TABLE,
      AttributeDefinitions: [
        { AttributeName: 'LockID', AttributeType: 'S' },
      ],
      KeySchema: [
        { AttributeName: 'LockID', KeyType: 'HASH' },
      ],
      BillingMode: 'PAY_PER_REQUEST',
    }));
  }
  catch (error: any) {
    if (error?.name !== 'ResourceInUseException') {
      throw error;
    }
  }

  await waitUntilTableExists({ client, maxWaitTime: 900, maxDelay: 30, minDelay: 5 }, { TableName: LOCK_TABLE });
  await silence(['ValidationException'], client.send(new UpdateTimeToLiveCommand({
    TableName: LOCK_TABLE,
    TimeToLiveSpecification: {
      AttributeName: 'Expiration',
      Enabled: true,
    },
  })));

  try {
    await client.send(new PutItemCommand({
      TableName: LOCK_TABLE,
      Item: {
        LockID: { S: app },
        Expiration: { N: expiration.toString(10) },
      },
      ConditionExpression: 'attribute_not_exists(LockID) OR Expiration < :now',
      ExpressionAttributeValues: {
        ':now': { N: now.toString(10) },
      },
    }));
  }
  catch (error: any) {
    if (error?.name !== 'ConditionalCheckFailedException') {
      throw error;
    }

    // The lock already exists.
    throw new Error('Another deployment is already in progress (locked).');
  }

  function scheduleExtension(): void {
    updateTimeout = setTimeout(() => {
      updatePromise = Promise.resolve().then(async () => {
        const newExpiration = (nowSeconds() + LOCK_SECONDS);

        try {
          await client.send(new PutItemCommand({
            TableName: LOCK_TABLE,
            Item: {
              LockID: { S: app },
              Expiration: { N: newExpiration.toString(10) },
            },
            ConditionExpression: 'Expiration = :expiration',
            ExpressionAttributeValues: {
              ':expiration': { N: expiration.toString(10) },
            },
          }));
        }
        catch (error: any) {
          console.error('Lock update failed.', error);
          // eslint-disable-next-line unicorn/no-process-exit
          process.exit(1);
        }

        expiration = newExpiration;
        scheduleExtension();
      });
    }, LOCK_EXTEND_INTERVAL_SECONDS * 1000);
  }

  scheduleExtension();

  try {
    return await callback();
  }
  finally {
    await updatePromise;
    clearTimeout(updateTimeout);

    try {
      await client.send(new DeleteItemCommand({
        TableName: LOCK_TABLE,
        Key: {
          LockID: { S: app },
        },
        ConditionExpression: 'Expiration = :expiration',
        ExpressionAttributeValues: {
          ':expiration': { N: expiration.toString(10) },
        },
      }));
    }
    catch (error: any) {
      console.warn('Lock release failed.', error);
    }
  }
}

function nowSeconds(): number {
  return Math.ceil(Date.now() / 1000);
}
