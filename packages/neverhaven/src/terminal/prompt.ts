import os from 'node:os';

import { PromiseController } from '@seahax/promise-controller';

import type { Keyboard, KeypressEvent } from '../keyboard.ts';

export type PromptFunction = (message?: string) => Promise<string>;

const DEFAULT_PROMPT_MESSAGE = '> ';

export function createPromptFunction(signal: AbortSignal, keyboard: Keyboard): PromptFunction {
  let history: string[] = [];

  return async (message = DEFAULT_PROMPT_MESSAGE) => {
    const promiseController = new PromiseController<string>();
    const chars: string[] = [];

    let index = 0;
    let historyEnabled = true;
    let historyIndex = -1;

    process.stdout.write(os.EOL + message);
    keyboard.on('keypress', onKeyPress);
    signal.addEventListener('abort', cancel, { once: true });

    // All the logic is handled in callbacks, which will resolve/reject the
    // promise controller when an end condition is met.
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

    function cancel(): void {
      removeListeners();
      process.stdout.write(os.EOL);
      promiseController.reject(new DOMException('Terminal closed.', 'AbortError'));
    }

    function removeListeners(): void {
      keyboard.removeListener('keypress', onKeyPress);
      signal.removeEventListener('abort', cancel);
    };

    function enableHistory(enabled: boolean): void {
      if (historyEnabled === enabled) return;
      historyEnabled = enabled;
      historyIndex = -1;
    }
  };
}
