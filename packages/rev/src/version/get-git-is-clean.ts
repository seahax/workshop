import { $ } from 'execa';

export async function getGitIsClean({ dir }: { dir: string }): Promise<boolean> {
  const { stdout } = await $({
    stdout: 'pipe',
    cwd: dir,
  })`git status --porcelain .`;

  return stdout.trim().length === 0;
}
