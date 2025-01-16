import fs from 'node:fs/promises';

import { type GitLog } from './get-git-logs.js';

export async function updateChangelog(version: string, logs: readonly Pick<GitLog, 'fullText'>[]): Promise<void> {
  const text = await fs.readFile('CHANGELOG.md', 'utf8').catch((error: unknown) => {
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

  await fs.writeFile('CHANGELOG.md', newText);
}
