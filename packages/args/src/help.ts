import type { StandardSchemaV1 } from '@standard-schema/spec';
import * as chalkTemplate from 'chalk-template';
import wrapAnsi from 'wrap-ansi';

type PrintArgs = [strings?: TemplateStringsArray | undefined, ...values: unknown[]];

export interface Help {
  (...args: PrintArgs): void;
  toStderr(...args: PrintArgs): void;
};

export function createHelp(...args: PrintArgs): Help {
  const prefix = stringify(...args) + '\n';

  return Object.assign(printInternal(chalkTemplate.template, process.stdout, prefix), {
    toStderr: printInternal(chalkTemplate.templateStderr, process.stderr, prefix),
  });
}

export function createHelpSnippet(...args: PrintArgs): string {
  return stringify(...args);
}

function stringify(...[strings, ...values]: PrintArgs): string {
  if (strings == null) return '';

  values = values.map((value) => {
    if (isIssue(value)) return stringifyIssue(value);
    if (Array.isArray(value) && value.every((v) => isIssue(v))) {
      return value.map((issue) => stringifyIssue(issue)).join('\n');
    }

    return value;
  });

  return String.raw(strings, ...values).replaceAll(/^(?:\r?\n)+|(?:\r?\n)+$/gu, '');
}

function stringifyIssue(value: StandardSchemaV1.Issue): string {
  const path = value.path
    ?.map((part) => typeof part === 'object' ? part.key : part)
    .map((part) => typeof part === 'symbol' ? '?' : part)
    .join(', ');

  return `Error${path ? ` (${path})` : ''}: ${value.message}`;
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

function printInternal(
  style: typeof chalkTemplate.template,
  writeStream: { write: (text: string) => void },
  prefix?: string,
): (...[strings, ...values]: PrintArgs) => void {
  return (strings, ...values) => {
    const text = stringify(strings, ...values);
    const styledText = style([prefix, text].filter(Boolean).join('\n'));
    const wrappedText = wrap(styledText);

    writeStream.write(wrappedText + '\n');
  };
}

function wrap(text: string): string {
  return text
    .replaceAll(/(?<=(?:\r?\n){2}|^)\S+(?:\s\S+)+(?=(?:\r?\n){2}|$)/gu, (match) => wrapAnsi(
      match.replaceAll(/[^\S ]/gu, ' '),
      Math.max(20, Math.min(80, process.stdout.columns)),
    ))
    .replaceAll(/[^\S\r\n]+$/gmu, '');
}
