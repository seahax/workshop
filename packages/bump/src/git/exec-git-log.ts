import { type Commit } from '../types/commit.js';
import { exec } from '../utils/exec.js';

export async function execGitLog(firstCommit: string): Promise<Commit[]> {
  const { stdout } = await exec`git log --pretty=format:%H%n%B%x00%x00%x00 ${firstCommit ? `${firstCommit}..HEAD` : 'HEAD'} -- .`;
  const entries = [...stdout.matchAll(/(.+)\n([\s\S]*?)\0{3}/gu)];
  const commits = entries.map(([, commit = '', body = '']) => ({
    hash: commit.trim(),
    log: body.trim(),
  }));

  return commits;
}
