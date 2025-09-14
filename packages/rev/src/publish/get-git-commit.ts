import { execa } from 'execa';

export async function getGitCommit({ dir }: { dir: string }): Promise<string> {
  const result = await execa({ cwd: dir })`git rev-parse HEAD`;
  return result.stdout;
}
