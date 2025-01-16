import { ResponseError } from './error.js';

export class Response extends globalThis.Response {
  readonly request: Request;

  constructor(response: globalThis.Response, request: Request) {
    super(response.body, response);
    this.request = request;
    this.assertOk = this.assertOk.bind(this);
  }

  assertOk(): void {
    if (!this.ok) {
      throw new ResponseError(this);
    }
  }
}
