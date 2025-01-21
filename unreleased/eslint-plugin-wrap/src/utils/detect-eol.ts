import { type SourceCode } from '@typescript-eslint/utils/ts-eslint';

export function detectEOL(sourceCode: SourceCode): string {
  return sourceCode.text.match(/\r?\n/u)?.[0] || '\n';
}
