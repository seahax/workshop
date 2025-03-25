import path from 'node:path';

export interface Config {
  staticPath: string;
}

export const config: Config = {
  staticPath: process.env.FRONTEND_PATH || path.resolve(import.meta.dirname, '../../frontend/dist'),
};
