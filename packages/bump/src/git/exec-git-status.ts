import { exec } from '../utils/exec.js';

export async function execGitStatus(): Promise<string> {
  const { stdout } = await exec`git status --porcelain .`;

  return stdout;
}
