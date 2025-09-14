import fs from 'node:fs/promises';
import path from 'node:path';

import type { PackageResult } from '@seahax/monorepo';
import chalk from 'chalk';
import { execa, parseCommandString } from 'execa';

import { getNpmMetadata } from '../util/get-npm-metadata.ts';

export async function publish({ pkg, command, dryRun, extraArgs, commit }: {
  pkg: PackageResult;
  command: string;
  dryRun: boolean;
  extraArgs: string[];
  commit: string;
}): Promise<{ exitCode: number } | undefined> {
  const dir = path.dirname(pkg.filename);
  const label = chalk.blue(`> ${pkg.data.name}:`);

  if (typeof pkg.data.version !== 'string' || pkg.data.private) {
    console.log(`${label} ${chalk.dim('private')}`);
    return;
  }

  if (await getNpmMetadata({ spec: `${pkg.data.name}@${pkg.data.version}` })) {
    console.log(`${label} ${chalk.dim('already published')}`);
    return;
  }

  console.log(`${label} ${chalk.white(pkg.data.version)}`);

  const packageText = await fs.readFile(pkg.filename, 'utf8');
  const patchedPackageText = JSON.stringify({ ...JSON.parse(packageText), gitHead: commit }, null, 2) + '\n';

  if (!dryRun) {
    await execa`git update-index --skip-worktree ${pkg.filename}`;
    await fs.writeFile(pkg.filename, patchedPackageText, 'utf8');
  }

  try {
    const [cmd, ...commandArgs] = parseCommandString(command);
    const result = await execa(cmd!, [...commandArgs, ...(dryRun ? ['--dry-run'] : []), ...extraArgs], {
      stdio: 'inherit',
      preferLocal: true,
      cwd: dir,
      reject: false,
    });

    return { exitCode: result.exitCode ?? 1 };
  }
  finally {
    if (!dryRun) {
      // Restore original package.json content.
      await fs.writeFile(pkg.filename, packageText, 'utf8');
      await execa`git update-index --no-skip-worktree ${pkg.filename}`;
    }
  }
}
