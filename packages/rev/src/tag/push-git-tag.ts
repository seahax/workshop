import { execa } from 'execa';

export async function pushGitTag({ tag }: { tag: string }): Promise<number> {
  const { exitCode = 1 } = await execa({ stdio: 'inherit', reject: false })`git push origin refs/tags/${tag}`;
  return exitCode;
}
