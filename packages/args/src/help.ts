import wrap from 'wrap-ansi';

import { type MetaType } from './meta.js';

export interface HelpOption {
  readonly type: MetaType;
  readonly usage: string;
  readonly info: string;
}

export interface HelpSubcommand {
  readonly usage: string;
  readonly info: string;
}

export interface HelpConfig {
  readonly usage: readonly string[];
  readonly info: readonly string[];
  readonly options: readonly HelpOption[];
  readonly subcommands: readonly HelpSubcommand[];
  readonly columns: number;
}

const USAGE_PREFIX = 'Usage: ';

export function renderHelp({
  usage,
  info,
  options,
  subcommands,
  columns,
}: HelpConfig): string {
  let text = '';

  if (usage.length > 0) {
    text += usage.map((line) => item(USAGE_PREFIX, line)).join('');
  }

  if (info.length > 0) {
    if (text) text += '\n';
    text += paragraphs(info);
  }

  const named: HelpOption[] = [];
  const positional: HelpOption[] = [];

  for (const option of options) {
    if (option.type === 'positional' || option.type === 'variadic') {
      positional.push(option);
    }
    else {
      named.push(option);
    }
  }

  if (named.length > 0) {
    if (text) text += '\n';
    text += 'Options:\n';
    text += list(named.map(({ usage, info }) => [`  ${usage}  `, info]));
  }

  if (positional.length > 0) {
    if (text) text += '\n';
    text += 'Arguments:\n';
    text += list(positional.map(({ usage, info }) => [`  ${usage}  `, info]));
  }

  if (subcommands.length > 0) {
    if (text) text += '\n';
    text += 'Commands:\n';
    text += list(subcommands.map(({ usage, info }) => [`  ${usage}  `, info]));
  }

  return text;

  function paragraphs(entries: readonly string[]): string {
    return entries.map((entry) => `${wrap(entry, columns)}\n`).join('\n');
  }

  function list(entries: readonly [prefix: string, text: string][]): string {
    const pad = entries.reduce((acc, [prefix]) => Math.max(acc, prefix.length), 0);
    return entries.map(([prefix, text]) => item(prefix.padEnd(pad, ' '), text)).join('');
  }

  function item(prefix: string, text: string): string {
    text = wrap(text, columns - prefix.length).replaceAll('\n', `\n${''.padEnd(prefix.length, ' ')}`);

    return `${prefix}${text}\n`;
  }
}
