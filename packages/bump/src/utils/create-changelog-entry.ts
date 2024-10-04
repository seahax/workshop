import { messageType } from '../constants/message-type.js';
import { type ChangelogEntry } from '../types/changelog-entry.js';
import { type Message } from '../types/message.js';

type GroupedMessages = Partial<Record<keyof typeof messageType, Message[]>>;

export function createChangelogEntry(version: string, messages: Message[]): ChangelogEntry {
  const groups = getGroupedMessages(messages);
  const sections = Object.entries(messageType)
    .flatMap(([type, { heading }]): string | [] => {
      const messages = groups[type];
      return messages?.length ? createSection(heading, messages) : [];
    });
  const content = `## ${version} - ${createDateString()}\n\n${sections.join('\n\n')}`;

  return { version, content };
}

function getGroupedMessages(messages: Message[]): Record<string, Message[]> {
  return messages.reduce<GroupedMessages>((groups, message) => ({
    ...groups,
    [message.type]: [
      ...(groups[message.type] || []),
      message,
    ],
  }), {});
}

function createSection(heading: string, messages: Message[]): string {
  const listItems = messages.map((message) => createListItem(message));

  return `### ${heading}\n\n${listItems.join('\n')}`;
}

function createListItem(message: Message): string {
  const parts: string[] = [];

  if (message.scope) {
    parts.push(`*(${message.scope})*`);
  }

  if (message.breaking) {
    parts.push('**[breaking]**');
  }

  parts.push(message.description);

  return `- ${parts.join(' ')}`;
}

function createDateString(): string {
  const date = new Date();
  const parts: string[] = [
    String(date.getFullYear()).padStart(4, '0'),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ];

  return parts.join('-');
}
