import {
  DeleteItemCommand,
  DynamoDBClient,
  PutItemCommand,
  UpdateTimeToLiveCommand,
} from '@aws-sdk/client-dynamodb';
import { type AwsCredentialIdentityProvider } from '@smithy/types';

import { TABLE_LOCKS } from '../constants/tables.js';
import { silence } from './silence.js';
import { createTable } from './table.js';

interface Params {
  readonly app: string;
  readonly credentials: AwsCredentialIdentityProvider;
}

const LOCK_SECONDS = 1800; // 30 minutes.
const LOCK_EXTEND_INTERVAL_SECONDS = 300; // 5 minutes.

export async function lock<T>({ app, credentials }: Params, callback: () => Promise<T>): Promise<T> {
  const client = new DynamoDBClient({ credentials, region: 'us-east-1' });
  const now = nowSeconds();
  let expiration = (now + LOCK_SECONDS);
  let updateTimeout: NodeJS.Timeout | undefined;
  let updatePromise: Promise<void> | undefined;

  await createTable({ client, name: TABLE_LOCKS, partition: 'LockID' });
  await silence(['ValidationException'], client.send(new UpdateTimeToLiveCommand({
    TableName: TABLE_LOCKS,
    TimeToLiveSpecification: {
      AttributeName: 'Expiration',
      Enabled: true,
    },
  })));

  try {
    await client.send(new PutItemCommand({
      TableName: TABLE_LOCKS,
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
            TableName: TABLE_LOCKS,
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
        TableName: TABLE_LOCKS,
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
