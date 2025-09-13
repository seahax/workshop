import { type Linter } from 'eslint';

export type ConfigArrayNested = (Linter.Config | ConfigArrayNested)[];
export function defineConfig(...configs: ConfigArrayNested): Linter.Config[];
