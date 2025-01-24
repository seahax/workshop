import { getOptions } from '../options.js';
import { createRule } from '../utils/create-rule.js';
import { createRuleFix } from '../utils/create-rule-fix.js';
import { detectEOL } from '../utils/detect-eol.js';
import { detectIndentString } from '../utils/detect-indent-string.js';
import { getLeadingWhitespace } from '../utils/get-leading-whitespace.js';
import { getLine } from '../utils/get-line.js';

export default createRule('export', 'Wrap export names on long lines.', (context, report) => {
  const { maxLen, tabWidth, autoFix } = getOptions(context);
  const eol = detectEOL(context.sourceCode);
  const indentString = detectIndentString(context.sourceCode, tabWidth);

  return {
    ExportNamedDeclaration({ loc, specifiers: nodes }) {
      // Already wrapped.
      if (loc.start.line !== loc.end.line) return;

      const line = getLine(context.sourceCode, loc.start.line);

      // Line does not exceed max length.
      if (line.length <= maxLen) return;

      // Nothing to wrap.
      if (nodes.length === 0) return;

      const leadingWhitespace = getLeadingWhitespace(line);
      const fix = createRuleFix(nodes, {
        sourceCode: context.sourceCode,
        eol,
        leadingWhitespace,
        indentString,
      });

      report('EXPORTS', loc, fix, autoFix);
    },
  };
});
