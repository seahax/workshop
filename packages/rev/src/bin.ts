#!/usr/bin/env node
import { alias, createHelp, cue, parseCommands, parseOptions } from '@seahax/args';
import chalk from 'chalk';

import { listCommand } from './list/command.ts';
import { publishCommand } from './publish/command.ts';
import { tagCommand } from './tag/command.ts';
import { versionCommand } from './version/command.ts';

const help = createHelp`
{bold Usage:} rev {green <command>} {blue [options]}

Project version and release management tool (package manager agnostic).
Supports single packages and monorepos. Recursively finds all non-private
packages starting in the current working directory.

Read the docs:
https://github.com/seahax/workshop/blob/main/packages/rev/README.md

{bold Commands:}
  {green version}   Bump changed package versions.
  {green tag}       Tag a release commit.
  {green publish}   Publish packages with new versions.
  {green list}      List all packages.

{bold Options:}
  {blue --help, -h}   Show this help message.
`;

const handlers: Readonly<Record<string, (args: string[]) => Promise<void>>> = {
  version: versionCommand,
  tag: tagCommand,
  publish: publishCommand,
  list: listCommand,
};

await (async () => {
  const command = parseCommands(process.argv.slice(2), Object.keys(handlers));

  if (command.name) {
    const handler = handlers[command.name];

    if (!handler) return help.error`{red Unknown command "${command.name}".}`.exit(1);

    try {
      await handler(command.args);
      process.exit();
    }
    catch (error: unknown) {
      console.error(chalk.red(String(error)));
      process.exit(1);
    }
  }

  const options = await parseOptions(process.argv.slice(2), {
    '--help': cue(),
    '-h': alias('--help'),
  });

  if (options.value === '--help') return help().exit();
  if (options.issues) return help.error`{red ${options.issues[0]}}`.exit(1);

  return help.error`{red A command is required.}`.exit(1);
})();
