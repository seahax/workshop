import os from 'node:os';

import ansiRegex from 'ansi-regex';
import wrap from 'wrap-ansi';

import type { Keyboard } from '../keyboard.ts';

export type PrintFunction = (
  ...args:
    | [message?: string]
    | [strings: TemplateStringsArray, ...args: any[]]
) => Promise<void>;

const FINAL_DELAY = getSegmentDelay('.');

export function createPrintFunction(signal: AbortSignal, keyboard: Keyboard): PrintFunction {
  return async (...[messageOrTemplateStrings = '', ...args]) => {
    const segments: string[] = [];
    const printImmediateController = new AbortController();
    const printImmediatePromise = new Promise<void>((resolve) => {
      printImmediateController.signal.addEventListener('abort', () => resolve(), { once: true });
    });

    let index = 0;
    let delay = 0;
    let text = typeof messageOrTemplateStrings === 'string'
      ? messageOrTemplateStrings
      : messageOrTemplateStrings.reduce((acc, string, index) => acc + string + String(args[index] ?? ''), '');

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

    // On keypress, print the remaining output immediately, aborting the
    // "typewriter" effect.
    keyboard.once('keypress', printImmediate);

    for (const [i, segment] of segments.entries()) {
      if (printImmediateController.signal.aborted) {
        process.stdout.write(segments.slice(i).join(''));
        break;
      }

      process.stdout.write(segment);
      delay = getSegmentDelay(segment);

      if (delay) await Promise.race([printImmediatePromise, new Promise((resolve) => setTimeout(resolve, delay))]);
      if (signal.aborted) break;
    }

    if (FINAL_DELAY > delay) {
      await Promise.race([
        printImmediatePromise,
        new Promise((resolve) => setTimeout(resolve, FINAL_DELAY - delay)),
      ]);
    }

    process.stdout.write(os.EOL);
    keyboard.removeListener('keypress', printImmediate);

    function printImmediate(): void {
      printImmediateController.abort();
    }
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
