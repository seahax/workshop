import path from 'node:path';

import chalk from 'chalk';
import semver from 'semver';

import type { Result } from './rev.ts';

export function printResult(result: Result): void {
  const label = chalk.blue(path.relative(process.cwd(), result.dir) + ':');

  if (result.state !== 'changed') {
    console.log(label + ' ' + chalk.dim(result.state === 'unchanged' ? 'No changes' : 'Private'));
    return;
  }

  const diff = semver.diff(result.versions.from, result.versions.to);
  const color = diff?.includes('patch') ? chalk.green : (diff?.includes('minor') ? chalk.yellow : chalk.red);

  console.log(label + ' ' + chalk.white(result.versions.from + ' →') + ' ' + color(result.versions.to));
  result.logs.forEach(({ fullText }) => {
    const styledText = chalk.level === 0
      ? fullText
      : fullText
          // Bold
          .replaceAll(/(__|\*\*)(.*?)\1/gu, (_0, _1, text) => chalk.bold(text))
          // Italic
          .replaceAll(/(_|\*)(.*?)\1/gu, (_0, _1, text) => chalk.italic(text))
      ;

    console.log('  ' + chalk.dim(`- ${styledText}`));
  });
}
