import type { Config } from './types.d.ts';

export type ConfigArrayNested = (Config | ConfigArrayNested)[];
export function defineConfig(...configs: ConfigArrayNested): Config[];
