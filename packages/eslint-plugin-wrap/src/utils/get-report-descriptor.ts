import { type TSESTree } from '@typescript-eslint/utils';
import { type ReportDescriptor, type ReportFixFunction } from '@typescript-eslint/utils/ts-eslint';

import type * as messages from '../constants/messages.js';

type MessageId = keyof typeof messages;

export function getReportDescriptor(
  messageId: MessageId,
  target: TSESTree.Node | TSESTree.Token | TSESTree.SourceLocation,
  fix: ReportFixFunction,
  autoFix: boolean,
): ReportDescriptor<MessageId> {
  const loc = 'loc' in target ? target.loc : target;

  return {
    messageId,
    loc,
    ...(autoFix
      ? { fix }
      : { suggest: [{ messageId, data: { column: loc.start.column }, fix }] }),
  };
};
