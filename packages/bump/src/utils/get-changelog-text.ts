import semver from 'semver';

import { type ChangelogEntry } from '../types/changelog-entry.js';

export function getChangelogText(header: string, entries: ChangelogEntry[]): string {
  entries = entries.sort((a, b) => semver.compare(b.version, a.version, { loose: true }));

  return [header, ...entries].join('\n\n') + '\n';
}
