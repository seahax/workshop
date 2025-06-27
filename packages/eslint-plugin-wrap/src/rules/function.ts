import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';

import { getOptions } from '../options.ts';
import { createRule } from '../utils/create-rule.ts';
import { createRuleFix } from '../utils/create-rule-fix.ts';
import { detectEOL } from '../utils/detect-eol.ts';
import { detectIndentString } from '../utils/detect-indent-string.ts';
import { getLeadingWhitespace } from '../utils/get-leading-whitespace.ts';
import { getLine } from '../utils/get-line.ts';

type FunctionNode = (
  | TSESTree.FunctionDeclaration
  | TSESTree.FunctionExpression
  | TSESTree.ArrowFunctionExpression
  | TSESTree.TSFunctionType
  | TSESTree.TSMethodSignature
  | TSESTree.CallExpression
  | TSESTree.NewExpression
);

export default createRule('function', 'Wrap function arguments on long lines.', (context, report) => {
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
    const start = getStart(node);
    const end = getEnd(node);

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

    report('FUNCTION_PARAMS', { start, end }, fix, autoFix);
  }
});

function getStart(node: FunctionNode): TSESTree.Position {
  if (node.parent.type === AST_NODE_TYPES.MethodDefinition) return node.parent.loc.start;
  if (node.type === AST_NODE_TYPES.CallExpression || node.type === AST_NODE_TYPES.NewExpression) {
    if (node.callee.type === AST_NODE_TYPES.Identifier) return node.callee.loc.start;
    if (node.callee.type === AST_NODE_TYPES.MemberExpression) return node.callee.property.loc.start;
  }

  return node.loc.start;
}

function getEnd(node: FunctionNode): TSESTree.Position {
  return 'body' in node ? node.body.loc.start : node.loc.end;
}

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
