import { type ResponseEx } from './response.js';

export type Next = (
  request?: Request
) => Promise<ResponseEx>;
