import { type TSESTree } from '@typescript-eslint/utils';

import { getOptions } from '../options.js';
import { createRule } from '../utils/create-rule.js';
import { createRuleFix } from '../utils/create-rule-fix.js';
import { detectEOL } from '../utils/detect-eol.js';
import { detectIndentString } from '../utils/detect-indent-string.js';
import { getLeadingWhitespace } from '../utils/get-leading-whitespace.js';
import { getLine } from '../utils/get-line.js';

export default createRule((context) => {
  const { maxLen, tabWidth, autoFix } = getOptions(context);
  const eol = detectEOL(context.sourceCode);
  const indentString = detectIndentString(context.sourceCode, tabWidth);

  return {
    ArrayExpression: listener,
    TSTupleType: listener,
  };

  function listener({ loc, ...rest }: TSESTree.ArrayExpression | TSESTree.TSTupleType): void {
    // Already wrapped.
    if (loc.start.line !== loc.end.line) return;

    const line = getLine(context.sourceCode, loc.start.line);

    // Line does not exceed max length.
    if (line.length <= maxLen) return;

    const nodes = 'elements' in rest ? rest.elements : rest.elementTypes;

    // Nothing to wrap.
    if (nodes.length === 0) return;

    const leadingWhitespace = getLeadingWhitespace(line);
    const fix = createRuleFix(nodes, {
      sourceCode: context.sourceCode,
      eol,
      leadingWhitespace,
      indentString,
    });

    context.report({
      messageId: 'wrapArrayElements',
      loc,
      ...(autoFix ? { fix } : { suggest: [{ messageId: 'wrapArrayElements', fix }] }),
    });
  }
});
