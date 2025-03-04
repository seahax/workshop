import os from 'node:os';

import { PromiseController } from '@seahax/promise-controller';
import { createSemaphore } from '@seahax/semaphore';
import ansiRegex from 'ansi-regex';
import wrap from 'wrap-ansi';

import type { Keyboard, KeypressEvent } from './keyboard.ts';

export interface Terminal {
  print(message?: string): Promise<void>;
  print(strings: TemplateStringsArray, ...args: any[]): Promise<void>;
  prompt(message?: string): Promise<string>;
  close(): Promise<void>;
}

const CLEAR = `\u001B[2J\u001B[3J\u001B[H`;
const DEFAULT_PROMPT_MESSAGE = '> ';
const FINAL_DELAY = getSegmentDelay('.');

export function createTerminal({ keyboard }: {
  readonly keyboard: Keyboard;
}): Terminal {
  const semaphore = createSemaphore();

  let history: string[] = [];

  process.stdout.write(CLEAR);

  return {
    print: semaphore.controlled(async (
      strings: TemplateStringsArray | string = '', ...args: any[]
    ) => {
      const segments: string[] = [];
      const abortController = new AbortController();
      const abortControllerPromise = new Promise<void>((resolve) => {
        abortController.signal.addEventListener('abort', () => resolve(), { once: true });
      });

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

      keyboard.once('keypress', onKeyPress);

      for (const [i, segment] of segments.entries()) {
        if (abortController.signal.aborted) {
          process.stdout.write(segments.slice(i).join(''));
          break;
        }

        process.stdout.write(segment);
        delay = getSegmentDelay(segment);

        if (delay) await Promise.race([abortControllerPromise, new Promise((resolve) => setTimeout(resolve, delay))]);
        if (semaphore.signal.aborted) break;
      }

      if (FINAL_DELAY > delay) {
        await Promise.race([
          abortControllerPromise,
          new Promise((resolve) => setTimeout(resolve, FINAL_DELAY - delay)),
        ]);
      }

      process.stdout.write(os.EOL);
      keyboard.removeListener('keypress', onKeyPress);

      function onKeyPress(): void {
        abortController.abort();
      }
    }),

    prompt: semaphore.controlled(async (
      message = DEFAULT_PROMPT_MESSAGE,
    ) => {
      const promiseController = new PromiseController<string>();
      const chars: string[] = [];

      let index = 0;
      let historyEnabled = true;
      let historyIndex = -1;

      process.stdout.write(os.EOL + message);
      keyboard.on('keypress', onKeyPress);
      semaphore.signal.addEventListener('abort', onSemaphoreAbort, { once: true });

      return await promiseController.promise;

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

            if (line) {
              removeListeners();
              if (history[0] !== line) history = [line, ...history.filter((value) => value !== line)];
              if (history.length > 100) history = history.slice(0, 100);
              process.stdout.write(os.EOL + os.EOL);
              promiseController.resolve(line);
            }

            break;
          }
          case 'other': {
            // Nothing to do.
            break;
          }
        }
      }

      function onSemaphoreAbort(): void {
        removeListeners();
        process.stdout.write(os.EOL);
        promiseController.reject(new DOMException('Terminal closed.', 'AbortError'));
      }

      function removeListeners(): void {
        keyboard.removeListener('keypress', onKeyPress);
        semaphore.signal.removeEventListener('abort', onSemaphoreAbort);
      };

      function enableHistory(enabled: boolean): void {
        if (historyEnabled === enabled) return;
        historyEnabled = enabled;
        historyIndex = -1;
      }
    }),

    async close() {
      if (!semaphore.signal.aborted) {
        semaphore.abort();
        keyboard.close();
      }

      await semaphore.drain();
    },
  };
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
