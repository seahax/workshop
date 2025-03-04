import { AST_TOKEN_TYPES, type TSESTree } from '@typescript-eslint/utils';
import { type RuleFix, type RuleFixer, type SourceCode } from '@typescript-eslint/utils/ts-eslint';

export interface RuleFixContext {
  readonly sourceCode: SourceCode;
  readonly eol: string;
  readonly leadingWhitespace: string;
  readonly indentString: string;
  readonly leaderString?: string;
  readonly trailerString?: string;
  readonly fixer: RuleFixer;
}

export function createRuleFix(targets: readonly (TSESTree.Node | TSESTree.Token | null)[], {
  sourceCode,
  eol,
  leadingWhitespace,
  indentString,
  leaderString,
  trailerString,
}: Omit<RuleFixContext, 'fixer'>): (fixer: RuleFixer) => Generator<RuleFix> {
  return function* fix(fixer) {
    const lastIndex = targets.length - 1;

    for (const [i, node] of targets.entries()) {
      if (node == null) continue;

      const prevToken = sourceCode.getTokenBefore(node);

      yield fixer.replaceTextRange(
        [prevToken?.range[1] ?? node.range[0], node.range[0]],
        `${eol}${leadingWhitespace}${indentString}${i === 0 && leaderString ? leaderString : ''}`,
      );

      if (i !== lastIndex) continue;

      let hasTerminator = false;
      let lastNode = node;

      {
        const nextToken = sourceCode.getTokenAfter(node);

        if (nextToken?.type === AST_TOKEN_TYPES.Punctuator && (nextToken.value === ',' || nextToken.value === ';')) {
          lastNode = nextToken;
          hasTerminator = true;
        }
      };

      const start = lastNode.range[1];
      const end = sourceCode.getTokenAfter(lastNode)?.range[0] ?? start;
      const suffix = hasTerminator || !trailerString
        ? `${eol}${leadingWhitespace}`
        : `${trailerString}${eol}${leadingWhitespace}`;

      yield fixer.replaceTextRange([start, end], suffix);
    }
  };
}
