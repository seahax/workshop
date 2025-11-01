import path from 'node:path';

import type { PackageResult } from '@seahax/monorepo';
import chalk from 'chalk';
import { execa, parseCommandString } from 'execa';

import { checkPublished } from './check-published.ts';

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

  if (await checkPublished(pkg.data.name, pkg.data.version)) {
    console.log(`${label} ${chalk.dim('version exists')}`);
    return;
  }

  console.log(`${label} ${chalk.green(pkg.data.version)}`);

  const [cmd, ...commandArgs] = parseCommandString(command);
  const publishResult = await execa(cmd!, [...commandArgs, ...(dryRun ? ['--dry-run'] : []), ...extraArgs], {
    stdio: 'inherit',
    preferLocal: true,
    cwd: dir,
    reject: false,
  });

  if (publishResult.exitCode !== 0) {
    // eslint-disable-next-line unicorn/no-process-exit
    process.exit(publishResult.exitCode);
  }

  if (!dryRun) {
    const tag = `${pkg.data.name}@${pkg.data.version}`;
    const tagResult = await execa(
      { stdio: 'inherit', preferLocal: true, cwd: dir, reject: false },
    )`git tag -f ${tag}`;

    if (tagResult.exitCode === 0) {
      await execa(
        { stdio: 'inherit', preferLocal: true, cwd: dir, reject: false },
      )`git push -f origin tag ${tag}`;
    }
  }
}
