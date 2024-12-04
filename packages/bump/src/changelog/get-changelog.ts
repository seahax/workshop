import fs from 'node:fs';

import semver from 'semver';

import { type Message } from '../types/message.js';
import { createChange } from './create-change.js';
import { parseChangelog } from './parse-changelog.js';

export function getChangelog(
  changelogText: string,
  version: string,
  messages: Message[],
  note: string | undefined,
): string {
  const [header, changes] = parseChangelog(changelogText);
  const newChange = createChange(version, messages, note);
  const changeSections = [...changes.filter((change) => change.version !== newChange.version), newChange]
    .sort((a, b) => semver.compare(b.version, a.version, { loose: true }))
    .map(({ content }) => content);
  const text = [header || getDefaultHeader(), ...changeSections].join('\n\n') + '\n';

  return text;
}

function getDefaultHeader(): string {
  return fs.readFileSync(`${import.meta.dirname}/../../resources/default-header.md`, 'utf8').trim();
}
