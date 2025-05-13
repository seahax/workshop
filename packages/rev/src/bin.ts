import { alias, createHelp, cue, flag, parseOptions } from '@seahax/args';
import { main } from '@seahax/main';

import { getDirectories } from './get-directories.ts';
import { printResult } from './print-result.ts';
import { rev } from './rev.ts';

main(async () => {
  const options = await parseOptions(process.argv.slice(2), {
    '--force': flag(),
    '--allow-dirty': flag(),
    '--dry-run': flag(),
    '--help': cue('help'),
    '-h': alias('--help'),
  });

  if (options.value === 'help') {
    help();
    return;
  }

  if (options.issues) {
    help.toStderr`{red ${options.issues[0]}}`;
    process.exitCode ||= 1;
    return;
  }

  const {
    '--force': force,
    '--allow-dirty': allowDirty,
    '--dry-run': dryRun,
  } = options.value;
  const dirs = await getDirectories();
  const promises = dirs.map(async (dir) => await rev({ dir, force, allowDirty }));

  for (const promise of promises) {
    const result = await promise;
    if (result.state === 'changed' && !dryRun) await result.commit();
    printResult(result);
  }
});

const help = createHelp`
{bold Usage:} rev [options]

A conventional(-ish) versioning tool. The type of version bump (patch, minor,
or major) is based loosely on the Conventional Commits spec.

Supports single packages and monorepos. Add globs to the ".rev" file at the
repo root to include multiple packages.

Read the docs:
https://github.com/seahax/workshop/blob/main/packages/rev/README.md

{bold Options:}
  --force         Bump the version even if there are no new commits.
  --allow-dirty   Allow the Git working directory to be dirty.
  --dry-run       Do not write any files.
  --help, -h      Show this help message.
`;
