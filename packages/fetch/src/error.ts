import { type Response } from './response.js';

export class ResponseError extends Error {
  readonly response: Response;

  constructor(response: Response) {
    super(response.statusText);
    this.response = response;
  }
}
