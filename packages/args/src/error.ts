export class ArgsError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'ArgsError';
  }

  override toString(): string {
    return `Error: ${this.message}`;
  }
}
