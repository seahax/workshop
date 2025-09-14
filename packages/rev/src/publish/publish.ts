import path from 'node:path';

import type { PackageResult } from '@seahax/monorepo';
import chalk from 'chalk';
import { execa, parseCommandString } from 'execa';

import { getNpmMetadata } from '../util/get-npm-metadata.ts';

export async function publish({ pkg, command, dryRun, extraArgs }: {
  pkg: PackageResult;
  command: string;
  dryRun: boolean;
  extraArgs: string[];
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
  const [cmd, ...commandArgs] = parseCommandString(command);
  const result = await execa(cmd!, [...commandArgs, ...(dryRun ? ['--dry-run'] : []), ...extraArgs], {
    stdio: 'inherit',
    preferLocal: true,
    cwd: dir,
    reject: false,
  });

  return { exitCode: result.exitCode ?? 1 };
}
