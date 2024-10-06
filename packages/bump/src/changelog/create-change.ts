import { messageType } from '../constants/message-type.js';
import { type Change } from '../types/change.js';
import { type Message } from '../types/message.js';

type GroupedMessages = Partial<Record<keyof typeof messageType, Message[]>>;

export function createChange(version: string, messages: Message[], note: string | undefined): Change {
  const groups = getGroupedMessages(messages);
  const sections: string[] = [`## ${version} (${createDateString()})`];

  if (note) {
    sections.push(note);
  }

  Object.entries(messageType).forEach(([type, { heading }]) => {
    const section = createSection(heading, groups[type]);

    if (section) {
      sections.push(section);
    }
  });

  const content = sections.join('\n\n');

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

function createSection(heading: string, messages: Message[] | undefined): string | undefined {
  if (!messages?.length) {
    return;
  }

  const listItems = messages.map((message) => createListItem(message));

  return `### ${heading}\n\n${listItems.join('\n')}`;
}

function createListItem(message: Message): string {
  const parts: string[] = [];

  if (message.scope) {
    parts.push(`*(${message.scope})*`);
  }

  if (message.isBreaking) {
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
