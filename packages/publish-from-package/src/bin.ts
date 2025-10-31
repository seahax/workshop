#!/usr/bin/env node
import { alias, createHelp, createHelpSnippet, cue, flag, option, parseOptions, string } from '@seahax/args';
import { getPackages } from '@seahax/monorepo';
import chalk from 'chalk';

import { checkGitClean } from './check-git-clean.ts';
import { getCommand } from './get-command.ts';
import { publish } from './publish.ts';

const help = createHelp`
{bold Usage:} publish-from-package {blue [options]} {yellow [-- <pm-options...>]}

Recursively publish public packages with new versions. A version is
considered new if "npm show <package>@<version>" returns a 404.

Publication is delegated to your package manager, which will be detected
automatically (npm, pnpm, or yarn berry) based on the presence of a lockfile
in the current directory or a parent directory. If there is no recognized
lockfile, the command will fail. You can override package manager detection
with the {blue --pm} option. Authentication and registry configuration are
handled by the package manager. All extra args are passed through to the
package manager command.

Example: Just publish with the detected package manager.

  {gray > publish-from-package}

Example: PNPM publish dry run.

  {gray > publish-from-package --command "pnpm publish" --dry-run}

Example: PNPM Pack instead of publish.

  {gray > publish-from-package --command "pnpm pack"}

Read the docs:
https://github.com/seahax/workshop/blob/main/packages/publish-from-package/README.md

{bold Options:}
  {blue --dry-run}       Do not actually publish, just show what would be done.
  {blue --command, -c}   Publish command (default: detected by lockfile)
  {blue --help, -h}      Show this help message.
`;

const noPackageManager = createHelpSnippet`
{red Could not detect the package manager. Please use the --command option.}
`;

void (async () => {
  const args = process.argv.slice(2);
  const options = await parseOptions(args, {
    '--dry-run': flag(),
    '--command': option(),
    '-c': alias('--command'),
    '--help': cue(),
    '-h': alias('--help'),
    extraPositional: string(),
  });

  if (options.value === '--help') {
    return help().exit();
  }

  if (options.issues) {
    return help.error`{red ${options.issues[0]}}`.exit(1);
  }

  const {
    '--dry-run': dryRun,
    '--command': command = await getCommand(process.cwd()),
    positional,
  } = options.value;

  if (!command) {
    return help.error`${noPackageManager}`.exit(1);
  }

  if (!dryRun && !await checkGitClean(process.cwd())) {
    console.error(chalk.red('Uncommitted changes found. Please commit or stash them before publishing.'));
    process.exit(1);
  }

  const packages = await getPackages(process.cwd());

  for (const pkg of packages) {
    await publish({ pkg, command, dryRun, extraArgs: positional });
  }
})();
