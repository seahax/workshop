import { MongoClient } from 'mongodb';

import { config } from './config.ts';

export interface Database {
  isConnected(): Promise<boolean>;
}

export async function initDatabase(): Promise<Database> {
  const client = new MongoClient(config.databaseUrl);

  await client.connect();

  const database = client.db();

  return {
    async isConnected(): Promise<boolean> {
      const stats = await database.stats();
      return stats.ok === 1;
    },
  };
}
