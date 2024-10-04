import fs from 'node:fs';

import semver from 'semver';

import { type ChangelogEntry } from '../types/changelog-entry.js';

export function parseChangelog(text: string): [header: string, entries: ChangelogEntry[]] {
  const [maybeHeader, ...sections] = text.split(/(?=^## \d+\.\d+\.\d+(?:[\s+-]|$))/mu);
  const header = maybeHeader?.trim()
    || fs.readFileSync(`${import.meta.dirname}/../resources/default-header.md`, 'utf8').trim();
  const entries = sections.flatMap((section): ChangelogEntry | [] => {
    const content = section.trim();
    const version = content.match(/(?<=^## )\d+\.\d+\.\d\S*/mu)![0];

    if (!semver.valid(version, { loose: true })) {
      return [];
    }

    return { version, content };
  });

  return [header, entries];
}
