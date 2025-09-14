#!/usr/bin/env node
import { alias, createHelp, createHelpSnippet, cue, flag, option, parseOptions, string } from '@seahax/args';
import { getPackages } from '@seahax/monorepo';

import { getGitCommit } from './get-git-commit.ts';
import { getPublishCommand } from './get-publish-command.ts';
import { publish } from './publish.ts';

const help = createHelp`
{bold Usage:} rev publish {blue [options]} {yellow [-- <pm-options...>]}

Publish packages to an npm registry. Only versions that are not already
published will be published. If a package version already exists in the
registry, it will be siliently skipped.

Publication is delegated to your package manager, which will be detected
automatically (npm, pnpm, or yarn berry) based on the presence of a lockfile
in the current directory or a parent directory. If there is no recognized
lockfile, the command will fail. You can override package manager detection
with the {blue --pm} option. Authentication and registry configuration are
handled by the package manager. All extra args are passed through to the
package manager command.

Example: Just publish with the detected package manager.

  {gray > rev publish}

Example: PNPM publish dry run.

  {gray > rev publish --command "pnpm publish" --dry-run}

Example: PNPM Pack instead of publish.

  {gray > rev publish --command "pnpm pack"}

Read the docs:
https://github.com/seahax/workshop/blob/main/packages/rev/README.md#publish

{bold Options:}
  {blue --dry-run}       Do not actually publish, just show what would be done.
  {blue --command, -c}   Publish command (default: detected by lockfile)
  {blue --help, -h}      Show this help message.
`;

const noPackageManager = createHelpSnippet`
{red Could not detect the package manager. Please use the --command option.}
`;

export async function publishCommand(args: string[]): Promise<void> {
  const options = await parseOptions(args, {
    '--dry-run': flag(),
    '--command': option(),
    '-c': alias('--command'),
    '--help': cue(),
    '-h': alias('--help'),
    extraPositional: string(),
  });

  if (options.value === '--help') {
    help();
    process.exit();
  }

  if (options.issues) {
    help.toStderr`{red ${options.issues[0]}}`;
    process.exit(1);
  }

  const {
    '--dry-run': dryRun,
    '--command': command = await getPublishCommand(process.cwd()),
    positional,
  } = options.value;

  if (!command) {
    help.toStderr`${noPackageManager}`;
    process.exit(1);
  }

  const packages = await getPackages(process.cwd());
  const commit = await getGitCommit({ dir: process.cwd() });

  for (const pkg of packages) {
    const result = await publish({ pkg, command, dryRun, extraArgs: positional, commit });

    if (result && result.exitCode !== 0) {
      process.exit(result.exitCode);
    }
  }
}
