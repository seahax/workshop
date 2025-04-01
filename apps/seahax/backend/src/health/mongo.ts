import { config } from '../config.ts';

export async function mongo(): Promise<boolean> {
  await config.mongo.db().command({ ping: 1 });
  return true;
}
