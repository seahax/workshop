import EventEmitter from 'node:events';
import os from 'node:os';

import { createSemaphore } from '@seahax/semaphore';
import ansiRegex from 'ansi-regex';
import wrap from 'wrap-ansi';

type KeypressEvent = {
  readonly key: 'enter' | 'backspace' | 'delete' | 'up' | 'down' | 'right' | 'left' | 'home' | 'end';
  readonly char?: undefined;
} | {
  readonly key: 'character';
  readonly char: string;
} | {
  readonly key: 'other';
  readonly data: Buffer;
};

export interface Terminal {
  print(message?: string): Promise<void>;
  print(strings: TemplateStringsArray, ...args: any[]): Promise<void>;
  prompt(message?: string): Promise<string>;
  close(): Promise<void>;
}

const $ESC = '\u001B';
const CTRL_C = '\u0003';
const ENTER = '\u000D';
const BACKSPACE = '\u007F';
const DELETE = `${$ESC}[3~`;
const UP = `${$ESC}[A`;
const DOWN = `${$ESC}[B`;
const RIGHT = `${$ESC}[C`;
const LEFT = `${$ESC}[D`;
const CLEAR = `${$ESC}[2J${$ESC}[3J${$ESC}[H`;
const HOME = `${$ESC}[H`;
const END = `${$ESC}[F`;
const DEFAULT_PROMPT_MESSAGE = '> ';

export function createTerminal(): Terminal {
  const semaphore = createSemaphore();
  const events = new EventEmitter<{
    keypress: [event: KeypressEvent];
  }>();

  let history: string[] = [];

  const self: Terminal = {
    print: semaphore.controlled(async (
      strings: TemplateStringsArray | string = '', ...args: any[]
    ) => {
      const controller = new AbortController();
      const controllerAbortPromise = new Promise<void>((resolve) => {
        controller.signal.addEventListener('abort', () => resolve());
      });
      const segments: string[] = [];

      let index = 0;
      let delay = 0;
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

      events.once('keypress', onKeyPress);

      for (const [i, segment] of segments.entries()) {
        if (controller.signal.aborted) {
          process.stdout.write(segments.slice(i).join(''));
          break;
        }

        process.stdout.write(segment);
        delay = getSegmentDelay(segment);

        if (delay) await Promise.race([controllerAbortPromise, new Promise((resolve) => setTimeout(resolve, delay))]);
        if (semaphore.signal.aborted) break;
      }

      const finalDelay = getSegmentDelay('.');

      if (finalDelay > delay) {
        await Promise.race([controllerAbortPromise, new Promise((resolve) => setTimeout(resolve, finalDelay - delay))]);
      }

      process.stdout.write(os.EOL);
      events.removeListener('keypress', onKeyPress);

      function onKeyPress(): void {
        controller.abort();
      }
    }),

    prompt: semaphore.controlled((
      message = DEFAULT_PROMPT_MESSAGE,
    ) => new Promise<string>((resolve, reject) => {
      const chars: string[] = [];

      let index = 0;
      let historyEnabled = true;
      let historyIndex = -1;

      process.stdout.write(os.EOL + message);
      events.on('keypress', onKeyPress);
      semaphore.signal.addEventListener('abort', onSemaphoreAbort, { once: true });

      function onKeyPress(event: KeypressEvent): void {
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
          case 'delete': {
            if (index >= chars.length) return;
            chars.splice(index, 1);
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
            if (index >= chars.length) return;
            ++index;
            process.stdout.moveCursor(1, 0);
            break;
          }
          case 'left': {
            if (index === 0) return;
            --index;
            process.stdout.moveCursor(-1, 0);
            break;
          }
          case 'home': {
            if (index === 0) return;
            process.stdout.moveCursor(-index, 0);
            index = 0;
            break;
          }
          case 'end': {
            if (index >= chars.length) return;
            process.stdout.moveCursor(chars.length - index, 0);
            index = chars.length;
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
            for (const char of event.data.toString('utf8')) {
              console.log(char.codePointAt(0)?.toString(16).padStart(4, '0'));
            }
            break;
          }
        }
      }

      function onSemaphoreAbort(): void {
        removeListeners();
        process.stdout.write(os.EOL);
        reject(new DOMException('Terminal closed.', 'AbortError'));
      }

      function removeListeners(): void {
        events.removeListener('keypress', onKeyPress);
        semaphore.signal.removeEventListener('abort', onSemaphoreAbort);
      };

      function enableHistory(enabled: boolean): void {
        if (historyEnabled === enabled) return;
        historyEnabled = enabled;
        historyIndex = -1;
      }
    })),

    async close() {
      if (!semaphore.signal.aborted) {
        semaphore.abort();
        process.stdin.pause();
        process.stdin.off('data', onData);
        process.stdin.setRawMode(false);
      }

      await semaphore.drain();
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

    if (isPrintableCharacter(char)) events.emit('keypress', { key: 'character', char });
    else if (char === BACKSPACE) events.emit('keypress', { key: 'backspace' });
    else if (char === DELETE) events.emit('keypress', { key: 'delete' });
    else if (char === UP) events.emit('keypress', { key: 'up' });
    else if (char === DOWN) events.emit('keypress', { key: 'down' });
    else if (char === RIGHT) events.emit('keypress', { key: 'right' });
    else if (char === LEFT) events.emit('keypress', { key: 'left' });
    else if (char === HOME) events.emit('keypress', { key: 'home' });
    else if (char === END) events.emit('keypress', { key: 'end' });
    else if (char === ENTER) events.emit('keypress', { key: 'enter' });
    else events.emit('keypress', { key: 'other', data });
  };
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
