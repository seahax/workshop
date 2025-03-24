import path from 'node:path';

export interface Config {
  staticPath: string;
}

export const config: Config = {
  staticPath: path.resolve(import.meta.dirname, '../frontend'),
};
