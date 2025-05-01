import { createCommand } from '@seahax/args';
import { main } from '@seahax/main';

import { getDirectories } from './get-directories.ts';
import { printResult } from './print-result.ts';
import { rev } from './rev.ts';

await main(async () => {
  await createCommand()
    .usage('rev [options]')
    .info([
      `Conventional(-ish) versioning tool. The type of version bump (patch,
      minor, or major) is based loosely on the Conventional Commits spec.`,

      `Supports single packages and monorepos. Add globs to the ".rev" file at
      the repo root to include multiple packages`,

      'Read the docs: https://github.com/seahax/workshop/blob/main/packages/rev/README.md',
    ])
    .boolean('force', 'Bump the version even if there are no new commits.')
    .boolean('allowDirty', 'Allow the Git working directory to be dirty.')
    .boolean('dryRun', 'Do not write any files.')
    .action(async ({ type, options }) => {
      if (type !== 'options') return;

      const { force, allowDirty, dryRun } = options;
      const dirs = await getDirectories();
      const promises = dirs.map(async (dir) => await rev({ dir, force, allowDirty }));

      for (const promise of promises) {
        const result = await promise;
        if (result.state === 'changed' && !dryRun) await result.commit();
        printResult(result);
      }
    })
    .parse(process.argv.slice(2));
});
