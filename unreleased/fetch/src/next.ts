import { type Response } from './response.js';

export type Next = (
  request?: Request
) => Promise<Response>;
