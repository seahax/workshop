import assert from 'node:assert';

import {
  CreateTableCommand,
  DynamoDBClient,
  ResourceInUseException,
  ResourceNotFoundException,
  waitUntilTableExists,
} from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { type AwsCredentialIdentityProvider } from '@smithy/types';

import { coalesce } from '../utils/coalesce.js';
import { collect } from '../utils/collect.js';
import { createId } from '../utils/id.js';
import { lazy } from '../utils/lazy.js';
import { paginated } from '../utils/paginated.js';
import { silence } from '../utils/silence.js';
import { type App, type AppIdString, type AppKey, type AppKeyString } from './app.js';

interface Meta {
  readonly bucket: { readonly name: string };
  readonly cdn: { readonly id: string; readonly domain: string };
  readonly 'cdn-policy': { readonly id: string; readonly name: string };
  readonly 'cdn-oac': { readonly id: string };
}

interface Key<TType extends keyof Meta> {
  /** Partition: App Key */
  readonly [ATTR_APP_KEY]: AppKeyString;
  /** Sort: Component (<type>:<name>) */
  readonly [ATTR_COMPONENT_KEY]: ComponentKey<TType>;
}

interface Item<TType extends keyof Meta> extends Key<TType> {
  /** Component Unique ID */
  readonly [ATTR_META]: Meta[TType];
  readonly [ATTR_CREATED]: string;
  readonly [ATTR_UPDATED]: string;
}

interface Params {
  readonly appKey: AppKey;
  readonly app: App;
  readonly credentials: AwsCredentialIdentityProvider;
}

export type ComponentIdString = `${AppIdString}-${string}`;
export type ComponentType = keyof Meta;
export type ComponentKey<TType extends ComponentType = ComponentType> = TType | `${TType}.${string}`;

export interface Components {
  /**
   * Check if a component has been resolved. A component being resolved
   * indicates that it is not scheduled for cleanup, and is therefore safe to
   * reference when creating dependent components.
   */
  isResolved(key: ComponentKey): boolean;

  /**
   * Save a component to the application state. If the third argument is a
   * callback, an ID is automatically generated and saved after the callback
   * completes without an error.
   */
  resolve<TType extends ComponentType, TResult extends { meta: Meta[TType] }>(
    key: ComponentKey<TType>,
    metaOrCallback: Meta[TType] | ((meta: Meta[TType] | undefined) => Promise<TResult>),
  ): Promise<TResult>;

  /**
   * Get a single component.
   */
  get<TType extends ComponentType>(key: ComponentKey<TType>): Promise<Meta[TType] | undefined>;

  /**
   * Get a single resolved component. Throws an error if the component is not
   * resolved.
   */
  getRequired<TType extends ComponentType>(key: ComponentKey<TType>): Meta[TType];

  /**
   * Get all components of a given type.
   */
  query<TType extends ComponentType>(
    type: TType
  ): Promise<ReadonlyMap<ComponentKey<TType>, Meta[TType]>>;

  /**
   * Remove a component from the application state.
   */
  delete(key: ComponentKey): Promise<void>;

  /**
   * Generate a new component ID.
   */
  createId(): Promise<ComponentIdString>;
}

const TABLE = 'engage-components';
const ATTR_APP_KEY = 'ak';
const ATTR_COMPONENT_KEY = 'ck';
const ATTR_META = 'm';
const ATTR_CREATED = 'ct';
const ATTR_UPDATED = 'ut';

export async function createComponents({ appKey, app, credentials }: Params): Promise<Components> {
  const resolved = new Map<ComponentKey, Record<string, any>>();
  const client = DynamoDBDocument.from(new DynamoDBClient({ region: 'us-east-1', credentials }));
  const init = lazy(async () => {
    // Try to create the table if necessary.
    await silence([ResourceInUseException], client.send(new CreateTableCommand({
      TableName: TABLE,
      AttributeDefinitions: [
        { AttributeName: ATTR_APP_KEY, AttributeType: 'S' },
        { AttributeName: ATTR_COMPONENT_KEY, AttributeType: 'S' },
      ],
      KeySchema: [
        { AttributeName: ATTR_APP_KEY, KeyType: 'HASH' },
        { AttributeName: ATTR_COMPONENT_KEY, KeyType: 'RANGE' },
      ],
      BillingMode: 'PAY_PER_REQUEST',
      DeletionProtectionEnabled: true,
    })));

    await waitUntilTableExists({ client, maxWaitTime: 900, maxDelay: 30, minDelay: 5 }, { TableName: TABLE });
  });

  const self: Components = {
    isResolved(key) {
      return resolved.has(key);
    },

    async resolve<TType extends ComponentType, TResult extends { meta: Meta[TType] }>(
      key: ComponentKey<TType>,
      metaOrCallback: Meta[TType] | ((meta: Meta[TType] | undefined) => Promise<TResult>),
    ) {
      await init();

      const item = await getItem(key);
      const meta = item?.[ATTR_META];
      const result = typeof metaOrCallback === 'function'
        ? await metaOrCallback(meta)
        : { meta: metaOrCallback } as TResult;

      const Item: Item<TType> = {
        [ATTR_APP_KEY]: appKey.toString(),
        [ATTR_COMPONENT_KEY]: key,
        [ATTR_META]: result.meta,
        [ATTR_CREATED]: item?.[ATTR_CREATED] ?? new Date().toISOString(),
        [ATTR_UPDATED]: new Date().toISOString(),
      };

      await client.put({ TableName: TABLE, Item });

      resolved.set(Item[ATTR_COMPONENT_KEY], Item[ATTR_META]);

      return result;
    },

    async get<TType extends ComponentType>(key: ComponentKey<TType>) {
      return await coalesce(
        () => resolved.get(key) as Meta[TType] | undefined,
        async () => {
          const item = await getItem(key);
          return item?.[ATTR_META];
        },
      );
    },

    getRequired<TType extends ComponentType>(key: ComponentKey<TType>) {
      const meta = resolved.get(key) as Meta[TType] | undefined;
      assert(meta, `Required component "${key}" is not present.`);
      return meta;
    },

    async query<TType extends ComponentType>(type: TType) {
      const items = await silence(
        [ResourceNotFoundException], async () => {
          const result = await client.get({
            TableName: TABLE,
            Key: { [ATTR_APP_KEY]: appKey.toString(), [ATTR_COMPONENT_KEY]: type } satisfies Key<TType>,
          });
          const item = result.Item as Item<TType> | undefined;
          const items = await collect(paginated(async (ExclusiveStartKey: Record<string, any> | undefined) => {
            const result = await client.query({
              TableName: TABLE,
              KeyConditionExpression: `${ATTR_APP_KEY} = :appKey and begins_with(${ATTR_COMPONENT_KEY}, :typePrefix)`,
              ExpressionAttributeValues: {
                ':appKey': appKey.toString(),
                ':typePrefix': `${type}.`,
              },
              ExclusiveStartKey,
            });

            return { values: result.Items as Item<TType>[], next: result.LastEvaluatedKey };
          }));

          return [...(item ? [item] : []), ...items];
        },
      );

      const result = new Map<ComponentKey<TType>, Meta[TType]>();

      items?.forEach((item) => {
        result.set(item[ATTR_COMPONENT_KEY], item[ATTR_META]);
      });

      return result;
    },

    async delete<TType extends ComponentType>(key: ComponentKey<TType>) {
      const Key: Key<TType> = { [ATTR_APP_KEY]: appKey.toString(), [ATTR_COMPONENT_KEY]: key };
      await silence([ResourceNotFoundException], client.delete({ TableName: TABLE, Key }));
    },

    async createId() {
      const appId = await app.resolve();
      return `${appId}-${createId(12)}`;
    },
  };

  return self;

  async function getItem<TType extends ComponentType>(key: ComponentKey<TType>): Promise<Item<TType> | undefined> {
    return await silence([ResourceNotFoundException], async () => {
      const result = await client.get({
        TableName: TABLE,
        Key: { [ATTR_APP_KEY]: appKey.toString(), [ATTR_COMPONENT_KEY]: key } satisfies Key<TType>,
      });

      return (result.Item as Item<TType> | undefined);
    });
  }
}
