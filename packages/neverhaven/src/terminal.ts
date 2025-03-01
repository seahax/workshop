import os from 'node:os';

import { Evented, onDOMEvent } from '@seahax/evented';
import { AbortError } from '@seahax/main';
import ansiRegex from 'ansi-regex';
import wrap from 'wrap-ansi';

interface Entry {
  readonly promise: Promise<unknown>;
  readonly abort: () => void;
}

type KeypressEvent = {
  readonly key: 'enter' | 'backspace' | 'up' | 'down' | 'right' | 'left';
  readonly char?: undefined;
} | {
  readonly key: 'character';
  readonly char: string;
} | {
  readonly key: 'other';
  readonly data: Buffer;
};

export interface Terminal {
  close(): Promise<void>;
  print(message?: string): Promise<void>;
  print(strings: TemplateStringsArray, ...args: any[]): Promise<void>;
  prompt(message?: string): Promise<string>;
}

const DEFAULT_PROMPT_MESSAGE = '> ';
const CTRL_C = '\u0003';
const ENTER = '\u000D';
const BACKSPACE = '\u007F';
const UP = '\u001B[A';
const DOWN = '\u001B[B';
const RIGHT = '\u001B[C';
const LEFT = '\u001B[D';
const CLEAR = `\u001B[2J\u001B[3J\u001B[H`;

export function createTerminal(): Terminal {
  const queue: Entry[] = [];
  const events = new Evented<{
    keypress: (event: KeypressEvent) => void;
    close: () => void;
  }>();

  let history: string[] = [];
  let closed: Promise<void> | undefined;

  const self: Terminal = {
    async close() {
      if (!closed) {
        closed = Promise.resolve().then(async () => {
          queue.forEach((entry) => entry.abort());
          await Promise.allSettled(queue.map((entry) => entry.promise));
          process.stdin.pause();
          process.stdin.off('data', onData);
          process.stdin.setRawMode(false);
        });
      }
    },

    async print(strings: TemplateStringsArray | string = '', ...args: any[]) {
      await next(async (signal) => {
        const ac = new AbortController();
        const removeKeypressHandler = events.on('keypress', () => {
          ac.abort();
        }, { once: true });
        const keypressPromise = new Promise<void>((resolve) => {
          ac.signal.addEventListener('abort', () => resolve());
        });

        let text = typeof strings === 'string'
          ? strings
          : strings.reduce((acc, string, index) => acc + string + String(args[index] ?? ''), '');

        text = text.trim();
        text = text.replaceAll('\t', ' ');
        text = text.replaceAll(/^ +| +$/gmu, '');
        text = text.replaceAll(/(?<![\r\n])\r?\n(?![\r\n])/gu, ' ');
        text = text.split(/(?:\r?\n)+/u).map((line) => process.stdout.columns >= 40
          ? wrap(line, Math.min(120, process.stdout.columns), { hard: true })
          : line,
        ).join(os.EOL + os.EOL);

        const segments: string[] = [];
        let index = 0;
        let delay = 0;

        for (const match of text.matchAll(ansiRegex())) {
          if (match.index > index) {
            segments.push(...text.slice(index, match.index).split(''));
          }

          segments.push(match[0]);
          index = match.index + match[0].length;
        }

        if (index < text.length) {
          segments.push(...text.slice(index).split(''));
        }

        for (const [i, segment] of segments.entries()) {
          if (ac.signal.aborted) {
            process.stdout.write(segments.slice(i).join(''));
            break;
          }

          process.stdout.write(segment);
          delay = getSegmentDelay(segment);

          if (delay) await Promise.race([keypressPromise, new Promise((resolve) => setTimeout(resolve, delay))]);
          if (signal.aborted) break;
        }

        const finalDelay = getSegmentDelay('.');

        if (finalDelay > delay) {
          await Promise.race([keypressPromise, new Promise((resolve) => setTimeout(resolve, finalDelay - delay))]);
        }

        process.stdout.write(os.EOL);
        removeKeypressHandler();
      });
    },

    async prompt(message = DEFAULT_PROMPT_MESSAGE) {
      return await next((signal) => new Promise<string>((resolve, reject) => {
        const chars: string[] = [];
        let index = 0;
        let historyEnabled = true;
        let historyIndex = -1;

        process.stdout.write(os.EOL + message);

        const removeAbortHandler = onDOMEvent('abort', signal, () => {
          removeListeners();
          process.stdout.write(os.EOL);
          reject(new AbortError({ cause: signal.reason }));
        }, { once: true });

        const removeKeypressHandler = events.on('keypress', (event: KeypressEvent): void => {
          switch (event.key) {
            case 'character': {
              enableHistory(false);
              chars.splice(index++, 0, event.char);
              process.stdout.write(event.char);
              if (index < chars.length) {
                process.stdout.write(chars.slice(index).join(''));
                process.stdout.moveCursor(-chars.length + index, 0);
              }
              break;
            }
            case 'backspace': {
              if (index === 0) return;
              chars.splice(--index, 1);
              process.stdout.moveCursor(-1, 0);
              process.stdout.clearLine(1);
              process.stdout.write(chars.slice(index).join(''));
              process.stdout.moveCursor(-chars.length + index, 0);
              enableHistory(chars.length === 0);
              break;
            }
            case 'up': {
              if (historyEnabled && historyIndex + 1 < history.length) {
                ++historyIndex;
                chars.length = 0;
                chars.push(...history[historyIndex]!.split(''));
                process.stdout.moveCursor(-index, 0);
                process.stdout.clearLine(1);
                process.stdout.write(chars.join(''));
                index = chars.length;
              }
              break;
            }
            case 'down': {
              if (historyEnabled && historyIndex > -1) {
                --historyIndex;
                chars.length = 0;
                process.stdout.moveCursor(-index, 0);
                process.stdout.clearLine(1);
                if (historyIndex >= 0) {
                  chars.push(...history[historyIndex]!.split(''));
                  process.stdout.write(chars.join(''));
                }
                index = chars.length;
              }
              break;
            }
            case 'right': {
              ++index;
              process.stdout.moveCursor(1, 0);
              break;
            }
            case 'left': {
              --index;
              process.stdout.moveCursor(-1, 0);
              break;
            }
            case 'enter': {
              const line = chars.join('').trim();
              if (!line) break;
              removeListeners();
              if (history[0] !== line) history = [line, ...history.filter((value) => value !== line)];
              if (history.length > 100) history = history.slice(0, 100);
              process.stdout.write(os.EOL + os.EOL);
              resolve(line);
              break;
            }
            case 'other': {
              // Nothing to do.
              break;
            }
          }
        });

        function removeListeners(): void {
          removeAbortHandler();
          removeKeypressHandler();
        };

        function enableHistory(enabled: boolean): void {
          if (historyEnabled === enabled) return;
          historyEnabled = enabled;
          historyIndex = -1;
        }
      }));
    },
  };

  process.stdin.setRawMode(true);
  process.stdin.on('data', onData);
  process.stdin.resume();
  process.stdout.write(CLEAR);

  return self;

  function onData(data: Buffer): void {
    const char = data.toString('utf8');

    if (char === CTRL_C) {
      process.emit('SIGINT');
      return;
    }

    if (isPrintableCharacter(char)) {
      events.emit('keypress', { key: 'character', char });
    }
    else if (char === BACKSPACE) {
      events.emit('keypress', { key: 'backspace' });
    }
    else if (char === UP) {
      events.emit('keypress', { key: 'up' });
    }
    else if (char === DOWN) {
      events.emit('keypress', { key: 'down' });
    }
    else if (char === RIGHT) {
      events.emit('keypress', { key: 'right' });
    }
    else if (char === LEFT) {
      events.emit('keypress', { key: 'left' });
    }
    else if (char === ENTER) {
      events.emit('keypress', { key: 'enter' });
    }
    else {
      events.emit('keypress', { key: 'other', data });
    }
  };

  function next<TResult>(task: (signal: AbortSignal) => Promise<TResult>): Promise<TResult> {
    if (closed) throw new AbortError();

    const ac = new AbortController();
    const promise = Promise.allSettled(queue.map((entry) => entry.promise)).then(() => {
      ac.signal.throwIfAborted();
      return task(ac.signal);
    });

    queue.unshift({ promise, abort: () => ac.abort() });

    return promise;
  }
}

function isPrintableCharacter(char: string): boolean {
  return char.split('').length === 1 && /^[\p{L}\p{M}\p{N}\p{P}\p{S}\p{Zs}]+$/u.test(char);
}

function getSegmentDelay(segment: string): number {
  switch (segment) {
    case '…': {
      return 3000;
    }
    case '!':
    case '?': {
      return 1000;
    }
    case '.': {
      return 500;
    }
    case ',':
    case ';':
    case ':': {
      return 200;
    }
    default: {
      if (segment.includes('\u001B')) return 0;
      if (segment.includes('\u009B')) return 0;
      if (/\p{P}/u.test(segment)) return 0;
      return 30;
    }
  }
}
