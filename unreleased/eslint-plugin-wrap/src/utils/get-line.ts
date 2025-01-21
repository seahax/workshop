import { type SourceCode } from '@typescript-eslint/utils/ts-eslint';

export function getLine(sourceCode: SourceCode, oneBasedLineNumber: number): string {
  return sourceCode.lines[oneBasedLineNumber - 1]?.trimEnd() ?? '';
}
