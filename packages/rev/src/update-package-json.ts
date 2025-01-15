import { $ } from 'execa';

export async function updatePackageJson(version: string): Promise<void> {
  await $`npm version ${version}`;
}
