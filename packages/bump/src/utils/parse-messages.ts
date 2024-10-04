import { messageType } from '../constants/message-type.js';
import { type GitLogEntry } from '../types/git-log-entry.js';
import { type Message } from '../types/message.js';

export function parseMessages(logs: GitLogEntry[]): Message[] {
  const messages: Message[] = [];

  for (const log of logs) {
    const logMessages = parseBody(log.body);
    const logCommit = log.commit.slice(0, 7);

    if (logMessages.length === 0) {
      throw new Error(`No valid conventional messages found in commit (${logCommit}).`);
    }

    logMessages.forEach((message) => {
      messages.push({ ...message, description: `${message.description} (${logCommit})` });
    });
  }

  return messages;
}

function parseBody(body: string): Message[] {
  const messages: Message[] = [];

  for (const [, parsedType = '', scope, breaking = '', description = ''] of body.matchAll(/^([a-z]+)(?:\((.*)\))?(!)?:[ \t]+(\S.*)$/gimu)) {
    const maybeType = parsedType.trim().toLowerCase();

    if (!isType(maybeType)) {
      continue;
    }

    messages.push({
      type: maybeType,
      scope: scope?.trim(),
      breaking: Boolean(breaking),
      description: description.trim(),
    });
  }

  if (/^BREAKING CHANGE: \S/mu.test(body)) {
    messages.forEach((message) => {
      message.breaking = true;
    });
  }

  return messages;
}

function isType(type: string): type is keyof typeof messageType {
  return type in messageType;
}
