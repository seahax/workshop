interface AbortErrorOptions {
  readonly message?: string;
  readonly cause?: unknown;
}

export class AbortError extends DOMException {
  constructor(options: AbortErrorOptions | string = {}) {
    const {
      message = 'The operation was aborted.',
      cause,
    } = typeof options === 'string' ? { message: options } : options;

    super(message, { name: 'AbortError', cause });
  }
}
