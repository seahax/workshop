import { ESLintUtils } from '@typescript-eslint/utils';
import { type RuleContext, type RuleListener, type RuleModule } from '@typescript-eslint/utils/ts-eslint';
import { type Rule } from 'eslint';

import type * as messages from '../constants/messages.js';
import { type Options } from '../options.js';

type MessageIds = keyof typeof messages;
type Create = (context: Readonly<RuleContext<keyof typeof messages, [Options?]>>) => RuleListener;

export function createRule(create: Create): Rule.RuleModule {
  const rule: RuleModule<MessageIds, [Options?]> = ESLintUtils.RuleCreator.withoutDocs({
    meta: {
      type: 'layout',
      fixable: 'whitespace',
      hasSuggestions: true,
      messages: {
        wrapFunctionParams: 'Wrap function parameters to reduce line length.',
        wrapNamedImports: 'Wrap named imports to reduce line length.',
        wrapObjectProperties: 'Wrap object properties to reduce line length.',
        wrapArrayElements: 'Wrap array elements to reduce line length.',
        wrapTernaryBranches: 'Wrap ternary branches to reduce line length.',
        wrapUnionTypes: 'Wrap union types to reduce line length.',
      },
      schema: [{
        type: 'object',
        properties: {
          maxLen: {
            type: 'integer',
            minimum: 0,
          },
          tabWidth: {
            type: 'integer',
            minimum: 0,
          },
          autoFix: {
            type: 'boolean',
          },
        },
        additionalProperties: false,
      }],
      defaultOptions: [],
    },
    defaultOptions: [],
    create,
  });

  return rule as unknown as Rule.RuleModule;
}
