import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';

import { getOptions } from '../options.js';
import { createRule } from '../utils/create-rule.js';
import { createRuleFix } from '../utils/create-rule-fix.js';
import { detectEOL } from '../utils/detect-eol.js';
import { detectIndentString } from '../utils/detect-indent-string.js';
import { getLeadingWhitespace } from '../utils/get-leading-whitespace.js';
import { getLine } from '../utils/get-line.js';

type FunctionNode =
  | TSESTree.FunctionDeclaration
  | TSESTree.FunctionExpression
  | TSESTree.ArrowFunctionExpression
  | TSESTree.TSFunctionType
  | TSESTree.TSMethodSignature
  | TSESTree.CallExpression
  | TSESTree.NewExpression;

export default createRule((context) => {
  const { maxLen, tabWidth, autoFix } = getOptions(context);
  const eol = detectEOL(context.sourceCode);
  const indentString = detectIndentString(context.sourceCode, tabWidth);

  return {
    FunctionDeclaration: listener,
    FunctionExpression: listener,
    ArrowFunctionExpression: listener,
    TSFunctionType: listener,
    TSMethodSignature: listener,
    CallExpression: listener,
    NewExpression: listener,
  };

  function listener(node: FunctionNode): void {
    const { loc, parent } = node;
    const start = parent.type === AST_NODE_TYPES.MethodDefinition ? parent.loc.start : loc.start;
    const end = 'body' in node ? node.body.loc.start : loc.end;

    // Already wrapped.
    if (start.line !== end.line) return;

    const line = getLine(context.sourceCode, start.line);

    // Line is short enough.
    if (line.length <= maxLen) return;

    const nodes = getNodes(node);

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
      messageId: 'FUNCTION_PARAMS',
      loc: { start, end },
      ...(autoFix ? { fix } : { suggest: [{ messageId: 'FUNCTION_PARAMS', fix }] }),
    });
  }
});

function getNodes(node: FunctionNode): (TSESTree.Node | null)[] {
  const params = 'params' in node ? node.params : node.arguments;

  if (!params[0]) return [];
  if (params.length === 1) {
    if (isObjectNode(params[0])) return params[0].properties;
    if (isArrayNode(params[0])) return params[0].elements;
  }

  return params;
}

function isObjectNode(node: TSESTree.Node): node is TSESTree.ObjectExpression | TSESTree.ObjectPattern {
  return node.type === AST_NODE_TYPES.ObjectExpression || node.type === AST_NODE_TYPES.ObjectPattern;
}

function isArrayNode(node: TSESTree.Node): node is TSESTree.ArrayExpression {
  return node.type === AST_NODE_TYPES.ArrayExpression;
}