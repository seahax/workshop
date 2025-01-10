import {
  ConditionalCheckFailedException,
  CreateTableCommand,
  DynamoDBClient,
  ResourceInUseException,
  UpdateTimeToLiveCommand,
  waitUntilTableExists,
} from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { type AwsCredentialIdentityProvider } from '@smithy/types';

import { silence } from '../utils/silence.js';
import { type AppKey, type AppKeyString } from './app.js';

interface Params {
  readonly appKey: AppKey;
  readonly credentials: AwsCredentialIdentityProvider;
}

interface Key {
  /** Partition: App Key */
  readonly [ATTR_APP_KEY]: AppKeyString;
}

interface Item extends Key {
  /** Expiration */
  readonly [ATTR_EXPIRATION]: number;
}

export interface Lock {
  delete(): Promise<void>;
}

const TABLE = 'engage-locks';
const ATTR_APP_KEY = 'ak';
const ATTR_EXPIRATION = 'exp';
const LOCK_SECONDS = 1800; // 30 minutes.
const LOCK_EXTEND_INTERVAL_SECONDS = 300; // 5 minutes.

export async function createLock({ appKey, credentials }: Params): Promise<Lock> {
  const client = DynamoDBDocument.from(new DynamoDBClient({ region: 'us-east-1', credentials }));

  // Try to create the table. Ignore the error if it already exists.
  const created = await silence([ResourceInUseException], client.send(new CreateTableCommand({
    TableName: TABLE,
    AttributeDefinitions: [
      { AttributeName: ATTR_APP_KEY, AttributeType: 'S' },
    ],
    KeySchema: [
      { AttributeName: ATTR_APP_KEY, KeyType: 'HASH' },
    ],
    BillingMode: 'PAY_PER_REQUEST',
    DeletionProtectionEnabled: true,
  })));

  if (created) {
    await waitUntilTableExists({ client, maxWaitTime: 900, maxDelay: 30, minDelay: 5 }, { TableName: TABLE });
    await client.send(new UpdateTimeToLiveCommand({
      TableName: TABLE,
      TimeToLiveSpecification: {
        AttributeName: ATTR_EXPIRATION,
        Enabled: true,
      },
    }));
  }

  const now = nowSeconds();

  let expiration = (now + LOCK_SECONDS);
  let updateTimeout: NodeJS.Timeout | undefined;
  let updatePromise: Promise<void> | undefined;

  try {
    await client.put({
      TableName: TABLE,
      Item: { [ATTR_APP_KEY]: appKey.toString(), [ATTR_EXPIRATION]: expiration } satisfies Item,
      ConditionExpression: `attribute_not_exists(${ATTR_EXPIRATION}) OR ${ATTR_EXPIRATION} < :now`,
      ExpressionAttributeValues: {
        ':now': now,
      },
    });
  }
  catch (error: any) {
    if (error instanceof ConditionalCheckFailedException) {
      throw new Error('Another deployment is already in progress (locked).');
    }

    throw error;
  }

  function scheduleExtension(): void {
    updateTimeout = setTimeout(() => {
      updatePromise = Promise.resolve().then(async () => {
        const newExpiration = (nowSeconds() + LOCK_SECONDS);

        try {
          await client.update({
            TableName: TABLE,
            Key: { [ATTR_APP_KEY]: appKey.toString() } satisfies Key,
            UpdateExpression: `SET ${ATTR_EXPIRATION} = :expiration`,
            ConditionExpression: `${ATTR_EXPIRATION} = :oldExpiration`,
            ExpressionAttributeValues: {
              ':expiration': newExpiration,
              ':oldExpiration': expiration,
            },
          });
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

    updateTimeout.unref();
  }

  scheduleExtension();

  return {
    async delete() {
      await updatePromise;
      clearTimeout(updateTimeout);

      try {
        await client.delete({
          TableName: TABLE,
          Key: { [ATTR_APP_KEY]: appKey.toString() } satisfies Key,
          ConditionExpression: `${ATTR_EXPIRATION} = :expiration`,
          ExpressionAttributeValues: {
            ':expiration': expiration,
          },
        });
      }
      catch (error) {
        console.warn('Lock release failed.', error);
      }
    },
  };
}

function nowSeconds(): number {
  return Math.ceil(Date.now() / 1000);
}
