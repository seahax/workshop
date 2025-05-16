import type { StandardSchemaV1 } from '@standard-schema/spec';
import chalkTemplate, { chalkTemplateStderr } from 'chalk-template';
import wrapAnsi from 'wrap-ansi';

import { HELP_PATH_SEGMENT } from './constants.ts';

type PrintArgs = [strings?: TemplateStringsArray | undefined, ...values: unknown[]];

interface HelpSnippet {
  _formatHelpSnippet(formatter: typeof chalkTemplate): string;
}

export interface Help {
  (...args: PrintArgs): void;
  toStderr(...args: PrintArgs): void;
};

export function createHelpSnippet(
  ...args: PrintArgs
): HelpSnippet {
  const [strings = Object.assign([''], { raw: [''] }), ...placeholders] = args;

  return {
    _formatHelpSnippet(format) {
      return format(strings, ...placeholders.map((value) => {
        if (isHelpSnippet(value)) return value._formatHelpSnippet(format);
        if (isIssue(value)) return stringifyIssue(value);
        return value;
      }));
    },
  };
}

export function createHelp(...args: PrintArgs): Help {
  const prefix = createHelpSnippet(...args);

  return Object.assign((...args: PrintArgs) => help(console.log, chalkTemplate, ...args), {
    toStderr: (...args: PrintArgs) => help(console.error, chalkTemplateStderr, ...args),
  });

  function help(log: typeof console.log, format: typeof chalkTemplate, ...args: PrintArgs): void {
    const prefixText = trimLines(prefix._formatHelpSnippet(format));
    const suffixText = trimLines(createHelpSnippet(...args)._formatHelpSnippet(format));
    const combinedText = prefixText
      ? (suffixText
          ? `${prefixText}\n\n${suffixText}`
          : `${prefixText}\n`)
      : suffixText;
    const wrappedText = wrap(combinedText);

    log(wrappedText);
  }
}

function isHelpSnippet(value: unknown): value is HelpSnippet {
  return typeof value === 'object'
    && value !== null
    && '_isHelpSnippet' in value
    && typeof value._isHelpSnippet === 'function';
}

function isIssue(value: unknown): value is StandardSchemaV1.Issue {
  return (
    typeof value === 'object'
    && value !== null
    && 'message' in value
    && typeof value.message === 'string'
    && (!('path' in value) || value.path === undefined || Array.isArray(value.path))
  );
}

function stringifyIssue(value: StandardSchemaV1.Issue): string {
  const path = stringifyIssuePath(value.path);

  return `Error${path ? ` (${path})` : ''}: ${value.message}`;
}

function stringifyIssuePath(path: StandardSchemaV1.Issue['path']): string {
  if (!path) return '';

  let prefix = '';
  let result = '';
  let segments: typeof path;

  if (typeof path[0] === 'object' && HELP_PATH_SEGMENT in path[0]) {
    prefix = path[0][HELP_PATH_SEGMENT] as string;
    segments = path.slice(1);
  }
  else {
    segments = path;
  }

  for (let segment of segments) {
    if (typeof segment === 'object') segment = segment.key;
    if (typeof segment === 'symbol') return '';

    if (typeof segment === 'number') {
      result += `[${segment}]`;
      continue;
    }

    if (/^\d|[^\w$]/u.test(segment)) {
      result += `[${JSON.stringify(segment)}]`;
      continue;
    }

    result += `${result ? '.' : ''}${segment}`;
  }

  if (result) result = `$${result}`;

  return prefix ? (result ? `${prefix} at ${result}` : prefix) : result;
}

function trimLines(text: string): string {
  return text.replaceAll(/^(?:\r?\n)+|(?:\r?\n)+$/gu, '');
}

function wrap(text: string): string {
  return text
    .replaceAll(/(?<=(?:\r?\n){2}|^)\S+(?:\s\S+)+(?=(?:\r?\n){2}|$)/gu, (match) => wrapAnsi(
      match.replaceAll(/[^\S ]/gu, ' '),
      Math.max(20, Math.min(80, process.stdout.columns)),
    ))
    .replaceAll(/[^\S\r\n]+$/gmu, '');
}
