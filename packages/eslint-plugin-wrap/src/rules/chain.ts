import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';
import { type SourceCode } from '@typescript-eslint/utils/ts-eslint';

import { getOptions } from '../options.js';
import { createRule } from '../utils/create-rule.js';
import { createRuleFix } from '../utils/create-rule-fix.js';
import { detectEOL } from '../utils/detect-eol.js';
import { detectIndentString } from '../utils/detect-indent-string.js';
import { getLeadingWhitespace } from '../utils/get-leading-whitespace.js';
import { getLine } from '../utils/get-line.js';

export default createRule('chain', 'Wrap chained method calls on long lines.', (context, report) => {
  const { maxLen, tabWidth, autoFix } = getOptions(context);
  const eol = detectEOL(context.sourceCode);
  const indentString = detectIndentString(context.sourceCode, tabWidth);

  return {
    CallExpression(node) {
      // Not a method call.
      if (node.callee.type !== AST_NODE_TYPES.MemberExpression) return;
      // Not the last call in a call chain.
      if (
        node.parent.type === AST_NODE_TYPES.MemberExpression
        && node.parent.parent.type === AST_NODE_TYPES.CallExpression
      ) return;

      const line = getLine(context.sourceCode, node.loc.end.line);

      // Line does not exceed max length.
      if (line.length <= maxLen) return;

      const nodes = getNodes(context.sourceCode, node);

      // Nothing to wrap.
      if (nodes.length === 0) return;

      // Already wrapped.
      if (nodes[0]!.object.loc.end.line !== node.loc.end.line) return;

      const tokens = nodes.map((node) => context.sourceCode.getTokenBefore(node.property));
      const leadingWhitespace = getLeadingWhitespace(line);
      const loc = {
        start: tokens[0]!.loc.start,
        end: node.loc.end,
      };
      const fix = createRuleFix([...tokens, null], {
        sourceCode: context.sourceCode,
        eol,
        leadingWhitespace,
        indentString: nodes[0]?.object.type === AST_NODE_TYPES.MemberExpression ? '' : indentString,
      });

      report('CHAIN', loc, fix, autoFix);
    },
  };
});

function getNodes(sourceCode: SourceCode, current: TSESTree.Node): TSESTree.MemberExpression[] {
  // Not a call.
  if (current.type !== AST_NODE_TYPES.CallExpression) return [];
  // Not a method call.
  if (current.callee.type !== AST_NODE_TYPES.MemberExpression) return [];
  // First call in the chain.
  if (current.callee.object.type === AST_NODE_TYPES.Identifier) return [];

  return [
    ...getNodes(sourceCode, current.callee.object),
    current.callee,
  ];
}
