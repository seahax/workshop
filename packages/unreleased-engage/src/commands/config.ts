import { type ResolvedConfig } from '../types/config.js';

export default async function config(config: ResolvedConfig): Promise<void> {
  console.log(JSON.stringify(config, null, 2));
}
