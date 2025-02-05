import { AST_NODE_TYPES } from '@typescript-eslint/utils';

import { getOptions } from '../options.ts';
import { createRule } from '../utils/create-rule.ts';
import { createRuleFix } from '../utils/create-rule-fix.ts';
import { detectEOL } from '../utils/detect-eol.ts';
import { detectIndentString } from '../utils/detect-indent-string.ts';
import { getLeadingWhitespace } from '../utils/get-leading-whitespace.ts';
import { getLine } from '../utils/get-line.ts';

export default createRule('import', 'Wrap import names on long lines.', (context, report) => {
  const { maxLen, tabWidth, autoFix } = getOptions(context);
  const eol = detectEOL(context.sourceCode);
  const indentString = detectIndentString(context.sourceCode, tabWidth);

  return {
    ImportDeclaration({ loc, specifiers }) {
      // Already wrapped.
      if (loc.start.line !== loc.end.line) return;

      const line = getLine(context.sourceCode, loc.start.line);

      // Line does not exceed max length.
      if (line.length <= maxLen) return;

      const nodes = specifiers.map((node) => node.type === AST_NODE_TYPES.ImportSpecifier ? node : null);

      // Nothing to wrap.
      if (!nodes.some((node) => node != null)) return;

      const leadingWhitespace = getLeadingWhitespace(line);
      const fix = createRuleFix(nodes, {
        sourceCode: context.sourceCode,
        eol,
        leadingWhitespace,
        indentString,
      });

      report('IMPORTS', loc, fix, autoFix);
    },
  };
});
