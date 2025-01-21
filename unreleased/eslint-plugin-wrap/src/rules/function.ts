import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';

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
    FunctionDeclaration: listener,
    FunctionExpression: listener,
    ArrowFunctionExpression: listener,
    TSFunctionType: listener,
    TSMethodSignature: listener,
    CallExpression: listener,
  };

  type Node =
    | TSESTree.FunctionDeclaration
    | TSESTree.FunctionExpression
    | TSESTree.ArrowFunctionExpression
    | TSESTree.TSFunctionType
    | TSESTree.TSMethodSignature
    | TSESTree.CallExpression;

  function listener({ loc, parent, ...rest }: Node): void {
    loc = {
      start: parent.type === AST_NODE_TYPES.MethodDefinition ? parent.loc.start : loc.start,
      end: 'body' in rest ? rest.body.loc.start : loc.end,
    };

    // Already wrapped.
    if (loc.start.line !== loc.end.line) return;

    const line = getLine(context.sourceCode, loc.start.line);

    // Line is short enough.
    if (line.length <= maxLen) return;

    const params = 'params' in rest ? rest.params : rest.arguments;
    const nodes = params[0]?.type === AST_NODE_TYPES.ObjectPattern ? params[0].properties : params;

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
      loc,
      ...(autoFix ? { fix } : { suggest: [{ messageId: 'FUNCTION_PARAMS', fix }] }),
    });
  }
});
