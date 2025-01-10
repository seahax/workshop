export class AbortError extends DOMException {
  constructor(message = 'The operation was aborted.') {
    super(message, 'AbortError');
  }
}
