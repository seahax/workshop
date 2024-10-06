import semver from 'semver';

import { type Change } from '../types/change.js';

export function parseChangelog(text: string): [header: string | undefined, changes: Change[]] {
  const [header, ...sections] = text.split(/(?=^## \d+\.\d+\.\d+(?:[\s+-]|$))/mu);
  const changes = sections.flatMap((section): Change | [] => {
    const content = section.trim();
    const version = content.match(/(?<=^## )\d+\.\d+\.\d\S*/mu)![0];

    if (!semver.valid(version, { loose: true })) {
      return [];
    }

    return { version, content };
  });

  return [header?.trim() || undefined, changes];
}
