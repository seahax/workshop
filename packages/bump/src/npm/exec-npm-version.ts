import { exec } from '../utils/exec.js';

export async function execNpmVersion(version: string): Promise<void> {
  await exec`npm version ${version} --no-git-tag-version --allow-same-version`;
}
