import fs from 'node:fs/promises';
import path from 'node:path';

import { type GitLog } from './get-git-logs.ts';

export async function updateChangelog({
  dir,
  version,
  logs,
}: { dir: string; version: string; logs: readonly Pick<GitLog, 'fullText'>[] }): Promise<void> {
  const filename = path.join(dir, 'CHANGELOG.md');
  const text = await fs.readFile(filename, 'utf8').catch((error: unknown) => {
    if ((error as any)?.code === 'ENOENT') return;
    throw error;
  });
  const index = text?.match(/^##[^#]/mu)?.index;
  const date = new Date().toISOString().split('T')[0];
  const heading = `## ${version} - ${date}\n\n`;
  const body = logs.reduce((text, { fullText }) => text + `- ${fullText}\n`, '')
    || (index ? 'No changes.\n' : (text ? 'Initial release.\n' : 'Changelog created.\n'));
  const entry = `${heading}${body}`;
  const newText = index
    ? text.slice(0, index) + entry + '\n' + text.slice(index)
    : (text || '# Changelog\n') + '\n' + entry;

  await fs.writeFile(filename, newText);
}
