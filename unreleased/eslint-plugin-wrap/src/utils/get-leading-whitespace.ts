export function getLeadingWhitespace(line: string): string {
  return line.match(/^\s*/u)?.[0] ?? '';
}
