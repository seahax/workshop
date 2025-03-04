import { createSemaphore } from '@seahax/semaphore';

import type { Keyboard } from '../keyboard.ts';
import { createPrintFunction } from './print.ts';
import { createPromptFunction } from './prompt.ts';

export interface Terminal {
  print(strings: TemplateStringsArray, ...args: any[]): Promise<void>;
  print(message?: string): Promise<void>;
  prompt(message?: string): Promise<string>;
  close(): Promise<void>;
}

const CLEAR = `\u001B[2J\u001B[3J\u001B[H`;

export function createTerminal({ keyboard }: {
  readonly keyboard: Keyboard;
}): Terminal {
  const semaphore = createSemaphore();
  const print = createPrintFunction(keyboard);
  const prompt = createPromptFunction(keyboard);

  process.stdout.write(CLEAR);

  return {
    print: semaphore.controlled(print),
    prompt: semaphore.controlled(prompt),

    async close() {
      if (!semaphore.signal.aborted) {
        semaphore.abort();
        keyboard.close();
      }

      await semaphore.drain();
    },
  };
}
