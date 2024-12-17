import YAML from 'yaml';

import { type ResolvedConfig } from '../types/config.js';

export default async function config(config: ResolvedConfig): Promise<void> {
  console.log(YAML.stringify(config));
}
