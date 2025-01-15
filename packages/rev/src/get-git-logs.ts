import { $ } from 'execa';

import { type NpmMetadata } from './get-npm-metadata.js';

export interface GitLog {
  readonly hash: string;
  readonly subject: string;
}

export async function getGitLogs({ gitHead }: Pick<NpmMetadata, 'gitHead'>): Promise<readonly GitLog[]> {
  const { stdout } = await $({
    stdout: 'pipe',
  })`git log ${'--pretty=format:%C(yellow)%h%C(reset) %s'} ${gitHead}..HEAD -- .`;

  return stdout.split('\n').filter(Boolean).flatMap((line) => {
    const match = line.match(/^\s*([a-f0-9]+)\s+(?=\S)(.+?)(?<=\S)\s*?$/mu);
    return match ? { hash: match[1]!, subject: match[2]! } : [];
  });
}
