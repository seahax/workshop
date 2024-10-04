import { type GitLogEntry } from '../types/git-log-entry.js';
import { exec } from './exec.js';

export async function execGitLog(firstCommit: string): Promise<GitLogEntry[]> {
  const { stdout } = await exec`git log --pretty=format:%H%n%B%x00%x00%x00 ${firstCommit ? `${firstCommit}..HEAD` : 'HEAD'}`;
  const entries = [...stdout.matchAll(/(.+)\n([\s\S]*?)\0{3}/gu)];
  const logs = entries.map(([, commit = '', body = '']) => ({
    commit: commit.trim(),
    body: body.trim(),
  }));

  return logs;
}
