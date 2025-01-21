import { type SourceCode } from '@typescript-eslint/utils/ts-eslint';

export function detectIndentString(sourceCode: SourceCode, indent = 2): string {
  return /^ {2}(?=\S)/mu.test(sourceCode.text) ? '  ' : ''.padEnd(indent, ' ');
}
