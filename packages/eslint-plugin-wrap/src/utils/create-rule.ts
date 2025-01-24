import { ESLintUtils, type TSESTree } from '@typescript-eslint/utils';
import {
  type RuleContext,
  type RuleFix,
  type RuleFixer,
  type RuleListener,
  type RuleModule,
} from '@typescript-eslint/utils/ts-eslint';
import { type Rule } from 'eslint';

import * as messages from '../constants/messages.js';
import { type Options, OPTIONS_SCHEMA } from '../options.js';

type MessageId = keyof typeof messages;
type Report = (
  messageId: MessageId,
  target: TSESTree.Node | TSESTree.Token | TSESTree.SourceLocation,
  fix: (fixer: RuleFixer) => Generator<RuleFix>,
  autoFix: boolean
) => void;
type Create = (context: Readonly<RuleContext<keyof typeof messages, [Options?]>>, report: Report) => RuleListener;

const reports = new Set<string>();

export function createRule(name: string, description: string, create: Create): Rule.RuleModule {
  const rule: RuleModule<MessageId, [Options?]> = ESLintUtils.RuleCreator.withoutDocs({
    meta: {
      docs: {
        description,
        url: `https://github.com/seahax/workshop/blob/main/packages/eslint-plugin-wrap/README.md#seahaxwrap${name}`,
      },
      type: 'layout',
      fixable: 'whitespace',
      hasSuggestions: true,
      messages,
      schema: [OPTIONS_SCHEMA],
      defaultOptions: [],
    },
    defaultOptions: [],
    create: ((context) => {
      reports.clear();

      return create(context, (messageId, target, fix, autoFix) => {
        const loc = 'loc' in target ? target.loc : target;
        const message = { messageId, data: { line: loc.start.line, column: loc.start.column } };
        const key = JSON.stringify([context.filename, loc.start.line]);

        if (reports.has(key)) {
          // Limit to one auto-fix per line, per fix iteration.
          autoFix = false;
        }

        reports.add(key);
        context.report({ loc, ...message, ...(autoFix ? { fix } : { suggest: [{ ...message, fix }] }) });
      });
    }) satisfies Create,
  });

  return rule as unknown as Rule.RuleModule;
}
