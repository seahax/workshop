// eslint-disable-next-line functional/no-classes
export class PromiseController<T> {
  readonly promise: Promise<T>;
  readonly #resolve: (value: T) => void;
  readonly #reject: (reason: any) => void;

  constructor() {
    let resolve: (value: T) => void;
    let reject: (reason: unknown) => void;

    this.promise = new Promise<T>((...args) => [resolve, reject] = args);
    this.#resolve = (value) => resolve(value);
    this.#reject = (reason) => reject(reason);
  }

  resolve(value: T): void {
    this.#resolve(value);
  }

  reject(reason: any): void {
    this.#reject(reason);
  }
}
