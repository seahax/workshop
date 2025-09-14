#!/usr/bin/env node
import { alias, createHelp, cue, parseOptions } from '@seahax/args';
import { getPackages, type PackageResult } from '@seahax/monorepo';
import chalk from 'chalk';

const help = createHelp`
{bold Usage:} rev list

List all packages recursively starting in the current working directory.
Includes versions, private status, and local dependencies.

{bold Options:}
  {blue --help, -h}   Show this help message.
`;

export async function listCommand(args: string[]): Promise<void> {
  const options = await parseOptions(args, {
    '--help': cue(),
    '-h': alias('--help'),
  });

  if (options.value === '--help') return help().exit();
  if (options.issues) return help.error`{red ${options.issues[0]}}`.exit(1);

  const packages = await getPackages(process.cwd());

  for (const pkg of packages) {
    printPackage(pkg);
  }
}

function printPackage(pkg: PackageResult): void {
  const label = chalk.blue(`${pkg.data.name}:`);
  const version = typeof pkg.data.version === 'string'
    ? chalk.white(` ${pkg.data.version}`)
    : chalk.yellow(' unversioned');
  const private_ = pkg.data.private || !pkg.data.version ? chalk.yellow(' (private)') : '';
  console.log(`${label}${version}${private_}`);

  for (let i = 0, max = pkg.localDependencies.length - 1; i <= max; ++i) {
    printDependency(pkg.localDependencies[i]!, i === max, '');
  }
}

function printDependency(pkg: PackageResult, isLast: boolean, indent: string): void {
  console.log(chalk.dim(`${indent}${isLast ? '└─' : '├─'}${pkg.data.name}`));

  for (let i = 0, max = pkg.localDependencies.length - 1; i <= max; ++i) {
    printDependency(pkg.localDependencies[i]!, i === max, indent + (isLast ? '  ' : '│ '));
  }
}
