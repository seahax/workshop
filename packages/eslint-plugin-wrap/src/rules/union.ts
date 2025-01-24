import { AST_TOKEN_TYPES } from '@typescript-eslint/utils';

import { getOptions } from '../options.js';
import { createRule } from '../utils/create-rule.js';
import { createRuleFix } from '../utils/create-rule-fix.js';
import { detectEOL } from '../utils/detect-eol.js';
import { detectIndentString } from '../utils/detect-indent-string.js';
import { getLeadingWhitespace } from '../utils/get-leading-whitespace.js';
import { getLine } from '../utils/get-line.js';

export default createRule('union', 'Wrap union types on long lines.', (context, report) => {
  const { maxLen, tabWidth, autoFix } = getOptions(context);
  const eol = detectEOL(context.sourceCode);
  const indentString = detectIndentString(context.sourceCode, tabWidth);

  return {
    TSUnionType({ loc, types }) {
      // Already wrapped.
      if (loc.start.line !== loc.end.line) return;

      const line = getLine(context.sourceCode, loc.start.line);

      // Line does not exceed max length.
      if (line.length <= maxLen) return;
      // Nothing to wrap.
      if (types.length <= 1) return;

      const nodes = [...types.map((current) => {
        const prev = context.sourceCode.getTokenBefore(current);
        return prev?.type === AST_TOKEN_TYPES.Punctuator && prev.value === '|' ? prev : current;
      }), null];
      const leadingWhitespace = getLeadingWhitespace(line);
      const fix = createRuleFix(nodes, {
        sourceCode: context.sourceCode,
        eol,
        leadingWhitespace,
        indentString,
        leaderString: nodes[0]?.type === AST_TOKEN_TYPES.Punctuator ? undefined : '| ',
      });

      report('UNION_TYPES', loc, fix, autoFix);
    },
  };
});
