import { execa } from 'execa';

export async function createGitTag({ tag, message, commit }: {
  tag: string;
  message: string;
  commit: string;
}): Promise<number> {
  const { exitCode = 1 } = await execa({ stdio: 'inherit', reject: false })`git tag -a ${tag} ${commit} -m ${message}`;
  return exitCode;
}
