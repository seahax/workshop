import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';
import { type SourceCode } from '@typescript-eslint/utils/ts-eslint';

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
    MemberExpression(node) {
      // Only look at top-level MemberExpressions so that chains are treated as
      // a single unit.
      if (context.sourceCode.getAncestors(node).some((ancestor) => ancestor.type === AST_NODE_TYPES.MemberExpression)) {
        return;
      }
      // Already wrapped.
      if (node.loc.start.line !== node.loc.end.line) return;

      const line = getLine(context.sourceCode, node.loc.start.line);

      // Line does not exceed max length.
      if (line.length <= maxLen) return;

      const nodes = getNodes(context.sourceCode, node);

      // Nothing to wrap.
      if (nodes.length === 0) return;

      const leadingWhitespace = getLeadingWhitespace(line);
      const fix = createRuleFix([...nodes, null], {
        sourceCode: context.sourceCode,
        eol,
        leadingWhitespace,
        indentString,
      });

      context.report({
        messageId: 'CHAIN',
        node: getReportNode(node),
        ...(autoFix ? { fix } : { suggest: [{ messageId: 'CHAIN', fix }] }),
      });
    },
  };
});

function getReportNode(node: TSESTree.MemberExpression): TSESTree.Node {
  if (node.parent.type === AST_NODE_TYPES.CallExpression) return node.parent;
  if (node.parent.type === AST_NODE_TYPES.NewExpression) return node.parent;
  return node;
}

function getNodes(sourceCode: SourceCode, node: TSESTree.Node): (TSESTree.Node | TSESTree.Token)[] {
  const current = 'property' in node ? sourceCode.getTokenBefore(node.property) : undefined;
  const next = 'object' in node
    ? getNodes(sourceCode, node.object)
    : ('callee' in node ? getNodes(sourceCode, node.callee) : []);

  return [
    ...(current ? [current] : []),
    ...next,
  ];
}
