#!/usr/bin/env node
import { alias, createHelp, cue, parseCommands, parseOptions } from '@seahax/args';
import chalk from 'chalk';

import { listCommand } from './list/command.ts';
import { publishCommand } from './publish/command.ts';
import { versionCommand } from './version/command.ts';

const help = createHelp`
{bold Usage:} rev {green <command>} {blue [options]}

Project version and release management tool (package manager agnostic).
Supports single packages and monorepos. Recursively finds all non-private
packages starting in the current working directory.

Read the docs:
https://github.com/seahax/workshop/blob/main/packages/rev/README.md

{bold Commands:}
  {green version}   Bump package versions based on commit history.
  {green publish}   Publish packages to an npm registry.
  {green list}      List all packages.

{bold Options:}
  {blue --help, -h}   Show this help message.
`;

const command = parseCommands(process.argv.slice(2), ['version', 'publish', 'list']);

try {
  if (command.name === 'version') {
    await versionCommand(command.args);
    process.exit();
  }

  if (command.name === 'publish') {
    await publishCommand(command.args);
    process.exit();
  }

  if (command.name === 'list') {
    await listCommand(command.args);
    process.exit();
  }
}
catch (error: unknown) {
  console.error(chalk.red(String(error)));
  process.exit(1);
}

const options = await parseOptions(process.argv.slice(2), {
  '--help': cue(),
  '-h': alias('--help'),
});

if (options.value === '--help') {
  help();
  process.exit();
}

if (options.issues) {
  help.toStderr`{red ${options.issues[0]}}`;
  process.exit(1);
}

help.toStderr`{red A command is required.}`;
process.exit(1);
