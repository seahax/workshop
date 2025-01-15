import { $ } from 'execa';

export async function getGitIsClean(): Promise<boolean> {
  const { stdout } = await $({
    stdout: 'pipe',
  })`git status --porcelain .`;

  return stdout.trim().length === 0;
}
