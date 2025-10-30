#!/usr/bin/env node
import { alias, createHelp, cue, parseOptions } from '@seahax/args';
import { getPackages } from '@seahax/monorepo';
import chalk from 'chalk';

const help = createHelp`
{bold Usage:} publish-precheck {blue [options]}

Check package.json files for problems to fix before publishing.

Read the docs:
https://github.com/seahax/workshop/blob/main/packages/publish-precheck/README.md

{bold Options:}
  {blue --dry-run}       Do not actually publish, just show what would be done.
  {blue --command, -c}   Publish command (default: detected by lockfile)
  {blue --help, -h}      Show this help message.
`;

void (async () => {
  const args = process.argv.slice(2);
  const options = await parseOptions(args, {
    '--help': cue(),
    '-h': alias('--help'),
  });

  if (options.value === '--help') {
    return help().exit();
  }

  for (const pkg of await getPackages(process.cwd())) {
    const { data } = pkg;
    const label = chalk.blue(`> ${pkg.data.name}:`);

    if (!pkg.data.version || pkg.data.private) {
      console.log(`${label} ${chalk.dim('private')}`);
      continue;
    }

    let pass = true;

    if (!data.license) problem(`missing "license" field`);
    if (!data.repository) problem(`missing "repository" field`);

    if (!Array.isArray(data.files)) {
      problem(`missing "files" field`);
    }
    else if (data.files.length === 0) {
      problem(`empty "files" field`);
    }

    if (!data.type) problem(`missing "type" field`);

    if (data.exports) {
      if (data.type !== 'module') problem(`type "module" required with "exports"`);
      if (!data.types) problem(`missing "types" field`);
    }
    else if (data.main) {
      if (data.type !== 'commonjs') problem(`type "commonjs" required with "main"`);
    }
    else if (!data.bin) {
      problem(`missing "exports", "main", or "bin" field`);
    }

    if (data.type === 'module') {
      if (!data.exports && !data.bin) problem(`type "module" requires "exports" or "bin"`);
    }
    else if (data.type === 'commonjs') {
      if (!data.main && !data.bin) problem(`type "commonjs" requires "main" or "bin"`);
    }
    else if (data.type) {
      problem(`invalid "type" field`);
    }
    else {
      problem(`missing "type" field`);
    }

    if (data.dependencies) {
      for (const [dep, ver] of Object.entries<string>(data.dependencies)) {
        if (ver.startsWith('workspace:')) problem(`has "workspace:" dependency "${dep}"`);
        if (ver.startsWith('file:')) problem(`has "file:" dependency "${dep}"`);
        if (ver === '*') problem(`has "*" dependency "${dep}"`);
      }
    }

    if (pass) {
      console.log(`${label} ${chalk.green('pass')}`);
    }

    function problem(message: string): void {
      if (pass) {
        pass = false;
        process.exitCode = 1;
        console.log(`${label} ${chalk.red('fail')}`);
      }

      console.log(`  - ${message}`);
    }
  }
})();
