import { execa } from 'execa';

export async function checkGitClean(dir: string): Promise<boolean> {
  const { stdout } = await execa(
    { stdio: 'pipe', preferLocal: true, cwd: dir, reject: false },
  )`git status --porcelain`;

  return stdout.trim().length === 0;
}
