import { ESLintUtils } from '@typescript-eslint/utils';
import { type RuleContext, type RuleListener, type RuleModule } from '@typescript-eslint/utils/ts-eslint';
import { type Rule } from 'eslint';

import * as messages from '../constants/messages.js';
import { type Options, OPTIONS_SCHEMA } from '../options.js';

type MessageId = keyof typeof messages;
type Create = (context: Readonly<RuleContext<keyof typeof messages, [Options?]>>) => RuleListener;

export function createRule(create: Create): Rule.RuleModule {
  const rule: RuleModule<MessageId, [Options?]> = ESLintUtils.RuleCreator.withoutDocs({
    meta: {
      type: 'layout',
      fixable: 'whitespace',
      hasSuggestions: true,
      messages,
      schema: [OPTIONS_SCHEMA],
      defaultOptions: [],
    },
    defaultOptions: [],
    create,
  });

  return rule as unknown as Rule.RuleModule;
}
