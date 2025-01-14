import wrap from 'wrap-ansi';

export interface HelpEntry {
  readonly usage: string;
  readonly info: string;
}

export interface HelpConfig {
  readonly usage: readonly string[];
  readonly info: readonly string[];
  readonly options: readonly HelpEntry[];
  readonly subcommands: readonly HelpEntry[];
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

  if (options.length > 0) {
    if (text) text += '\n';
    text += 'Options:\n';
    text += list(options.map(({ usage, info }) => [`  ${usage}  `, info]));
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
