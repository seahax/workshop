import EventEmitter from 'node:events';

export type KeypressEvent = {
  readonly key: 'enter' | 'backspace' | 'delete' | 'up' | 'down' | 'right' | 'left' | 'home' | 'end';
  readonly char?: undefined;
} | {
  readonly key: 'character';
  readonly char: string;
} | {
  readonly key: 'other';
  readonly data: Buffer;
};

const CTRL_C = '\u0003';
const ENTER = '\u000D';
const BACKSPACE = '\u007F';
const DELETE = `\u001B[3~`;
const UP = `\u001B[A`;
const DOWN = `\u001B[B`;
const RIGHT = `\u001B[C`;
const LEFT = `\u001B[D`;
const HOME = `\u001B[H`;
const END = `\u001B[F`;

export interface Keyboard extends EventEmitter<{
  keypress: [event: KeypressEvent];
}> {
  close(): void;
}

export function createKeyboard(): Keyboard {
  let closed = false;

  process.stdin.setRawMode(true);
  process.stdin.on('data', onData);
  process.stdin.resume();

  const self = Object.assign(new EventEmitter<{
    keypress: [event: KeypressEvent];
  }>(), {
    close() {
      if (closed) return;

      closed = true;
      process.stdin.pause();
      process.stdin.off('data', onData);
      process.stdin.setRawMode(false);
    },
  });

  return self;

  function onData(data: Buffer): void {
    const char = data.toString('utf8');

    if (char === CTRL_C) {
      process.emit('SIGINT');
      return;
    }

    if (isPrintableCharacter(char)) self.emit('keypress', { key: 'character', char });
    else if (char === BACKSPACE) self.emit('keypress', { key: 'backspace' });
    else if (char === DELETE) self.emit('keypress', { key: 'delete' });
    else if (char === UP) self.emit('keypress', { key: 'up' });
    else if (char === DOWN) self.emit('keypress', { key: 'down' });
    else if (char === RIGHT) self.emit('keypress', { key: 'right' });
    else if (char === LEFT) self.emit('keypress', { key: 'left' });
    else if (char === HOME) self.emit('keypress', { key: 'home' });
    else if (char === END) self.emit('keypress', { key: 'end' });
    else if (char === ENTER) self.emit('keypress', { key: 'enter' });
    else self.emit('keypress', { key: 'other', data });
  };
};

function isPrintableCharacter(char: string): boolean {
  return char.split('').length === 1 && /^[\p{L}\p{M}\p{N}\p{P}\p{S}\p{Zs}]+$/u.test(char);
}
