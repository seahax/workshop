import { type SourceCode } from '@typescript-eslint/utils/ts-eslint';

export function detectIndentString(sourceCode: SourceCode, tabWidth: number | 'tab' = 2): string {
  if (/^ {2}(?=\S)/mu.test(sourceCode.text)) return '  ';
  if (sourceCode.text.includes('\t')) return '\t';
  if (tabWidth === 'tab') return '\t';

  return ' '.repeat(tabWidth);
}
