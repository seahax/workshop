import { messageType } from '../constants/message-type.js';
import { type Commit } from '../types/commit.js';
import { type Message } from '../types/message.js';

export function parseCommits(commits: Commit[]): Message[] {
  const messages: Message[] = [];

  for (const commit of commits) {
    const commitMessages = parseBody(commit.log);
    const commitHash = commit.hash.slice(0, 7);

    commitMessages.forEach((message) => {
      messages.push({ ...message, description: `${message.description} (${commitHash})` });
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
      isBreaking: Boolean(breaking),
      description: description.trim(),
    });
  }

  if (/^BREAKING CHANGE: \S/mu.test(body)) {
    messages.forEach((message) => {
      message.isBreaking = true;
    });
  }

  return messages;
}

function isType(type: string): type is keyof typeof messageType {
  return type in messageType;
}
