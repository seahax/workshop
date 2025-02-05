import { type TSESTree } from '@typescript-eslint/utils';

import { getOptions } from '../options.ts';
import { createRule } from '../utils/create-rule.ts';
import { createRuleFix } from '../utils/create-rule-fix.ts';
import { detectEOL } from '../utils/detect-eol.ts';
import { detectIndentString } from '../utils/detect-indent-string.ts';
import { getLeadingWhitespace } from '../utils/get-leading-whitespace.ts';
import { getLine } from '../utils/get-line.ts';

export default createRule('ternary', 'Wrap ternary branches on long lines.', (context, report) => {
  const { maxLen, tabWidth, autoFix } = getOptions(context);
  const eol = detectEOL(context.sourceCode);
  const indentString = detectIndentString(context.sourceCode, tabWidth);

  return {
    ConditionalExpression: listener,
    TSConditionalType: listener,
  };

  function listener({ loc, ...rest }: TSESTree.ConditionalExpression | TSESTree.TSConditionalType): void {
    // Already wrapped.
    if (loc.start.line !== loc.end.line) return;

    const line = getLine(context.sourceCode, loc.start.line);

    // Line does not exceed max length.
    if (line.length <= maxLen) return;

    const [trueOpToken, falseOpToken] = 'consequent' in rest
      ? [context.sourceCode.getTokenBefore(rest.consequent)!, context.sourceCode.getTokenBefore(rest.alternate)!]
      : [context.sourceCode.getTokenBefore(rest.trueType)!, context.sourceCode.getTokenBefore(rest.falseType)!];
    const leadingWhitespace = getLeadingWhitespace(line);
    const fix = createRuleFix([trueOpToken, falseOpToken, null], {
      sourceCode: context.sourceCode,
      eol,
      leadingWhitespace,
      indentString,
    });

    report('TERNARY_BRANCHES', loc, fix, autoFix);
  }
});
