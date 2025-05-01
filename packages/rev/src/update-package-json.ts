import { $ } from 'execa';

export async function updatePackageJson({ dir, version }: { dir: string; version: string }): Promise<void> {
  await $({ cwd: dir })`npm version ${version}`;
}
